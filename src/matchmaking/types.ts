/**
 * Représente un joueur actuellement en attente dans la file de matchmaking.
 * Cet objet agit comme un instantané (snapshot) des données nécessaires à l'algorithme.
 */
export interface QueuedPlayer {
  /** Identifiant unique du joueur (Clé primaire métier) */
  userId: string;

  /** Identifiant technique de la connexion WebSocket */
  socketId: string;

  /** Score ELO figé au moment de l'inscription */
  elo: number;

  /** Timestamp (ms) de l'entrée dans la file (référence pour l'attente) */
  joinTime: number;

  /** Multiplicateur dynamique de tolérance (défaut: 1) */
  rangeFactor: number;
}

/**
 * Factory function pour instancier un QueuedPlayer avec des valeurs par défaut sécurisées.
 * Inclut un log de debug verveux pour tracer la création de l'objet.
 * 
 * @param userId - L'UUID de l'utilisateur
 * @param socketId - L'ID du socket client
 * @param elo - Le score ELO actuel
 */
export function createQueuedPlayer(userId: string, socketId: string, elo: number): QueuedPlayer {
  const joinTime = Date.now();
  const rangeFactor = 1;

  const player: QueuedPlayer = {
    userId,
    socketId,
    elo,
    joinTime,
    rangeFactor,
  };

  console.debug(
    `[Matchmaking] [Factory] Creating new QueuedPlayer instance | UserId: ${userId} | SocketId: ${socketId} | Elo: ${elo} | JoinTime: ${joinTime}`
  );

  return player;
}