import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MatchmakingService } from './matchmaking.service.js';
import {
  EXPANSION_INTERVAL_MS,
  TICK_RATE_MS,
} from './constants.js';

jest.useFakeTimers();

describe('MatchmakingService Test Suite', () => {
  let service: MatchmakingService;

  // Hook exécuté avant chaque test : Initialisation propre
  beforeEach(() => {
    console.debug('[TEST] [Setup] Instantiating MatchmakingService...');
    service = new MatchmakingService();
    service.onModuleInit(); // Démarre le ticker interne
  });

  // Hook exécté après chaque test : Nettoyage
  afterEach(() => {
    console.debug('[TEST] [Teardown] Cleaning up service and timers...');
    service.onModuleDestroy(); // Arrête le ticker
    jest.clearAllTimers(); // Réinitialise l'horloge interne de Jest
  });

  /**
   * Test 1 : Validation du matching immédiat.
   * Vérifie que deux joueurs avec un écart ELO faible sont appariés dès le premier cycle.
   * 
   * Calcul theorique :
   * - Tolérance initiale = BASE_TOLERANCE (50) + 1 * EXPANSION_STEP (50) = 100
   * - Ecart joueurs = |1200 - 1210| = 10
   * - Résultat attendu : 10 <= 100 -> MATCH.
   */
  it('should match compatible players immediately (within initial tolerance', () => {
    console.debug('[TEST] [Scenario 1] Starting Immediate Match Test');

    // 1. Injection des joueurs
    service.addPlayer('player1', 'socket1', 1200);
    service.addPlayer('player2', 'socket2', 1210);

    const initialStats = service.getQueueStats();
    expect(initialStats.size).toBe(2);
    console.debug(`[TEST] [Scenario 1] Players added. Queue size: ${initialStats.size}`);

    // 2. Avance du temps d'un tick (Simulation de la boucle)
    console.debug(`[TEST] [Scenario 1] Advancing time by ${TICK_RATE_MS}ms...`);
    jest.advanceTimersByTime(TICK_RATE_MS);

    // 3. Vérification
    const finalStats = service.getQueueStats();
    console.debug(`[TEST] [Scenario 1] Check after tick. Queue size: ${finalStats.size}`);

    expect(finalStats.size).toBe(0); // La file doit être vide
  });

  /**
   * Test 2 : Validation de l'algorithme "Bucket Expansion".
   * Vérifie que deux joueurs éloignés ne matchent PAS au début, mais finissent par matcher
   * une fois que le temps d'attente a élargi leur tolérance.
   * 
   * Paramètres (basés sur constants.ts) :
   * - BASE_TOLERANCE = 50
   * - EXPANSION_STEP = 50
   * - EXPANSION_INTERVAL_MS = 1000
   * 
   * Calcul théorique :
   * - Ecart joueurs = |1000 - 1200| = 200
   * - T=0s (Factor 1) : Tolérance = 50 + 50 = 100. (200 > 100) -> NO MATCH.
   * - T=1s (Factor 2) : Tolérance = 50 + 100 = 150. (200 > 150) -> NO MATCH.
  //  * - T=2s (Factor 3) : Tolérance = 50 + 150 = 200. (200 <= 200) -> MATCH.
   */
  it('should delay matching for incompatible players until tolerance expands', () => {
    console.debug('[TEST] [Scenario 2] Starting Expansion Match Test');

    // 1. Injection de joueurs avec un fort écart (200 points)
    service.addPlayer('newbie', 'socketA', 1000);
    service.addPlayer('pro', 'socketB', 1200);

    console.debug('[TEST] [Scenario 2] Players added (Diff: 200). Expecting initial wait.');

    // 2. Vérification immédiate (T + 1 tick)
    jest.advanceTimersByTime(TICK_RATE_MS);
    expect(service.getQueueStats().size).toBe(2);
    console.debug('[TEST] [Scenario 2] T+1s: Still queued (Tolerance too low).');

    // 3. Calcul du temps nécessaire pour atteindre une tolérance de 200
		// Tolérance requise = 200.
		// Formule : Tol = Base(50) + Factor * Step(50)
		// 200 = 50 + 50F => 150 = 50F => Factor = 3.
		// Le facteur commence à 1. Il faut gagner +2 niveaux.
		// Temps requis = 2 * EXPANSION_INTERVAL_MS = 2000ms.
		// On ajoute un buffer de sécurité (+Tick) pour être sûr que la boucle s'exécute après l'update.
		const timeToWait = 2 * EXPANSION_INTERVAL_MS + TICK_RATE_MS;

    console.debug(`[TEST] [Scenario 2] Advancing time by ${timeToWait}ms to trigger expansion...`);
    jest.advanceTimersByTime(timeToWait);

    // 4. Vérification finale
    const finalStats = service.getQueueStats();
    console.debug(`[TEST] [Scenario 2] Check after expansion. Queue size: ${finalStats.size}`);

    expect(finalStats.size).toBe(0); // Le match doit s'être produit
  });

  /**
   * Test 3 : Vérification de la robustesse (Anti-Spam).
   * Vérifie que le service rejette bien les doublons, comme implémenté dans les Guards.
   */
  it('should prevent duplicate user or socket entries', () => {
    console.debug('[TEST] [Scenario 3] Starting Guard Test');

    service.addPlayer('user1', 'socket1', 1000);

    // Tentative de réajout du même User ID
    expect(() => {
      service.addPlayer('user1', 'socket2', 1000);
    }).toThrow('User is already in the matchmaking queue');
    console.debug('[TEST] [Scenario 3] Duplicate UserId blocked successfully.');

    // Tentative de réutilisation du même Socket ID avec un autre User
    expect(() => {
      service.addPlayer('user2', 'socket1', 1000);
    }).toThrow('This connection is already queued');
    console.debug('[TEST] [Scenario 3] Duplicate SocketId blocked successfully.');
  });
});