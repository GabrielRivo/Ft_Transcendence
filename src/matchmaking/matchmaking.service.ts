import { Service, type OnModuleInit, type OnModuleDestroy } from 'my-fastify-decorators';
import { createQueuedPlayer, type QueuedPlayer } from './types.js';
import {
  BASE_TOLERANCE,
  EXPANSION_INTERVAL_MS,
  EXPANSION_STEP,
  TICK_RATE_MS
} from './constants.js'

@Service()
export class MatchmakingService implements OnModuleInit, OnModuleDestroy {
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
   * Référence au timer de la boucle de matchmaking pour nettoyahe propre.
   */
  private matchmakingInterval: NodeJS.Timeout | undefined;

  /**
   * Cycle de vie : Démarrage du module.
   * Initialise le ticker qui exécutera la boucle de décision périodiquement.
   */
  public onModuleInit(): void {
    console.info(
      `[MatchmakingService] [Lifecycle] Starting Matchmaking Loop | TickRate: ${TICK_RATE_MS}ms`
    );
    this.matchmakingInterval = setInterval(() => this.matchmakingLoop(), TICK_RATE_MS);
  }

  /**
   * Cycle de vie : Arrêt du module.
   * Nettoie le timer pour éviter les processus zombies.
   */
  public onModuleDestroy(): void {
    if (this.matchmakingInterval) {
      console.info('[MatchmakingService] [Lifecycle] Stopping Matchmaking Loop...');
      clearInterval(this.matchmakingInterval);
      this.matchmakingInterval = undefined;
    }
  }

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

  /**
   * Coeur du système : La Boucle de Matchmaking.
   * Exécutée à chaque tick, elle met à jour les priorités et tente de former des paires.
   */
  private matchmakingLoop(): void {
    // Optimisation : Inutile de lancer l'algo si moins de 2 joueurs
    if (this.activeQueue.size < 2) {
      return;
    }

    const startTick = Date.now();

    // --- Phase 1 : Mise à jour des états (Bucket Expansion) ---
    // On met à jour le facteur d'élargiseement de TOUS les joueurs selon leur temps d'attente.
    for (const player of this.activeQueue.values()) {
      const timeWaited = startTick - player.joinTime;
      // Formule : Facteur = 1 + (TempsAttente / Intervalle)
      // Exemple : Si wait=3000ms et interval=1000ms -> factor = 1 + 3 = 4
      const newFactor = 1 + Math.floor(timeWaited / EXPANSION_INTERVAL_MS);

      if (newFactor !== player.rangeFactor) {
        player.rangeFactor = newFactor;
      }
    }

    // Phase 2 : Appariement (Matching Strategy) ---
    // Conversion en tableau pour permettre la double itération.
    // Note : Performant pour N < 10k. Au-delà, une structure spatiale ou buckets serait requise.
    const candidates = Array.from(this.activeQueue.values());
    const matchedIds = new Set<string>(); // Garde trace des joueurs matchés dans ce cycle

    for (let i = 0; i < candidates.length; i++) {
      const playerA = candidates[i];

      // Si le joueur A a déjà été matché dans ce cycle (par une itération précédente), on passe.
      if (!playerA || matchedIds.has(playerA.userId)) continue;

      // Recherche d'un candidat B dans le reste de la file (j > i)
      for (let j = i + 1; j < candidates.length; j++) {
        const playerB = candidates[j];

        if (!playerB || matchedIds.has(playerB.userId)) continue;

        // Test de compatibilité mutuelle
        if (this.arePlayersCompatible(playerA, playerB)) {
          this.handleMatchFound(playerA, playerB);

          // Marquer comme traités pour éviter les doublons dans ce tick
          matchedIds.add(playerA.userId);
          matchedIds.add(playerB.userId);

          // PlayerA est satisfait, inutile de continuer à lui chercher un match.
          // On break la boucle interne pour passer au prochain candidat A.
          break;
        }
      }
    }
  }

  /**
   * Vérifie si deux joueurs sont compatibles pour un match.
   * La compatibilité doit être BIDIRECTIONNELLE :
   * - A doit accepter B (selon la tolérance de A)
   * - B doit accepter A (selon la tolérance de B)
   */
  private arePlayersCompatible(p1: QueuedPlayer, p2: QueuedPlayer): boolean {
    const eloDiff = Math.abs(p1.elo - p2.elo);

    const toleranceP1 = BASE_TOLERANCE + (p1.rangeFactor * EXPANSION_STEP);
    const toleranceP2 = BASE_TOLERANCE + (p2.rangeFactor * EXPANSION_STEP);

    return eloDiff <= toleranceP1 && eloDiff <= toleranceP2;
  }

  /**
   * Gère la résolution d'un match trouvé.
   * Retire les joueurs de la file et déclenche les processus aval.
   */
  private handleMatchFound(p1: QueuedPlayer, p2: QueuedPlayer): void {
    console.info(
      `[MatchmakingService] [MatchFound] Creating session | P1: ${p1.userId} (${p1.elo}) | P2: ${p2.userId} (${p2.elo})`
    );

    // Retrait atomique des deux joueurs
    this.removePlayer(p1.userId);
    this.removePlayer(p2.userId);

    // TODO: Emettre l'événement WebSocket aux clients
    // TODO: Appeler l'API du Game Service
  }
}
