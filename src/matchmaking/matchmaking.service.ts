import { Service } from 'my-fastify-decorators';
import { createQueuedPlayer, type QueuedPlayer } from './types.js';

@Service()
export class MatchmakingService {
  /**
   * Stockage principal des joueurs en attente.
   * 
   * Structure de données : Map<UserId, QueuedPlayer>
   * Complexité d'accès : O(1)
   * 
   * Note technique : En JavaScript/TypeScript, l'objet Map garantit contractuellement
   * la préservation de l'ordre d'insertion. Cela nous permet de conserver la logique
   * FIFO (First In, First Out) nécessaire au matchmaking sans structure additionnelle.
   */
  private activeQueue: Map<string, QueuedPlayer> = new Map();

  /**
   * Index secondaire pour la vérification d'unicité des connexions.
   * 
   * Structure de données : Set<SocketId>
   * Complexité d'accès : O(1)
   * 
   * Rôle : Empêcher qu'un même socket soit utilisé pour plusieurs entrées (anti-spam),
   * sans avoir à itérer sur toute la Map activeQueue pour vérifier l'existence du socketId.
   */
  private activeSockets: Set<string> = new Set();

  /**
   * Ajoute un joueur à la file d'attente.
   * 
   * Cette opération est atomique et effectue des vérifications de cohérence en temps constant O(1).
   * 
   * @param userId - l'identifiant unique (UUID) du joueur.
   * @param socketId - L'identifiant unique de la connexion WebSocket.
   * @param elo - Le score ELO du joueur au moment de l'inscription.
   * @returns L'objet QueuedPlayer instancié et stocké.
   * @throws Error Si le joueur est déjà présent dans la file (Doublon UserId).
   * @throws Error Si la connexion est déjà utilisée par une autre entrée (Doublon SocketId).
   */
  public addPlayer(userId: string, socketId: string, elo: number): QueuedPlayer {
    console.debug(
			`[MatchmakingService] [addPlayer] Incoming request | UserId: ${userId} | SocketId: ${socketId} | Elo: ${elo}`,
		);

    // 1. Guard (O(1)) : Vérification de l'unicité du UserId
		// Empêche un utilisateur de rejoindre plusieurs fois la file.
		if (this.activeQueue.has(userId)) {
			console.warn(
				`[MatchmakingService] [addPlayer] Action blocked: Player already exists in queue | UserId: ${userId}`,
			);
			throw new Error('User is already in the matchmaking queue');
		}

    // 2. Guard (O(1)) : Vérification de l'unicité du SocketId
		// Empêche l'utilisation abusive d'une même connexion ouverte.
		if (this.activeSockets.has(socketId)) {
			console.warn(
				`[MatchmakingService] [addPlayer] Action blocked: Socket already active in queue | SocketId: ${socketId}`,
			);
			throw new Error('This connection is already queued');
		}

    // 3. Instanciation (Factory Pattern)
    // Délègue la création et l'initialisation des métadonnées (joinTime, rangeFactor).
    const player = createQueuedPlayer(userId, socketId, elo);

    // 4. Persistance en mémoire (O(1))
    // Mise à jour simultanée de la structure principale et de l'index secondaire.
    this.activeQueue.set(userId, player);
    this.activeSockets.add(socketId);

    console.info(
			`[MatchmakingService] [addPlayer] Player added successfully | UserId: ${userId} | QueueSize: ${this.activeQueue.size}`,
		);

    return player;
  }

  /**
   * Retire un joueur de la file d'attente.
   * 
   * Cette méthode est idempotente : elle peut être appelée plusieurs fois pour le même ID
   * sans provoquer d'erreur ni d'effet de bord indésirable.
   * 
   * @param userId - L'identifiant unique du joueur à retirer.
   */
  public removePlayer(userId: string): void {
    console.debug(`[MatchmakingService] [removePlayer] Incoming request | UserId: ${userId}`);

    const player = this.activeQueue.get(userId);
    if (!player) {
      console.debug(
				`[MatchmakingService] [removePlayer] Player not found | UserId: ${userId}`,
			);
      return;
    }

    this.activeSockets.delete(player.socketId);
    this.activeQueue.delete(userId);

    console.info(
			`[MatchmakingService] [removePlayer] Player removed successfully | UserId: ${userId} | RemainingQueueSize: ${this.activeQueue.size}`,
		);
  }

  /**
   * Génère un instantané statistique de l'état actuel de la file.
   * 
   * @returns Un objet contenant la taille de la file et le temps d'attente maximum observé.
   */
  public getQueueStats(): { size: number; oldestRequestWaitTimeMs: number } {
    const size = this.activeQueue.size;
    let oldestRequestWaitTimeMs = 0;

    // Si la file n'est pas vide, on calcule le temps d'attente du premier élément.
    // Map.values() retourne un itérateur respectant l'ordre d'insertion.
    // .next.value permet d'accéder au premier élément (Tête de file / Head).
    if (size > 0) {
      const iterator = this.activeQueue.values();
      const oldestPlayer = iterator.next().value;
      if (oldestPlayer) {
        oldestRequestWaitTimeMs = Date.now() - oldestPlayer.joinTime;
      }
    }

    console.debug(
			`[MatchmakingService] [getQueueStats] Report generated | Size: ${size} | MaxWaitTime: ${oldestRequestWaitTimeMs}ms`,
		);

    return {
      size,
      oldestRequestWaitTimeMs
    }
  }
}
