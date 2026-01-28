// =============================================================================
// useMatchmaking Hook
// =============================================================================
//
// This hook manages the WebSocket connection to the matchmaking service and
// provides a clean interface for components to interact with the matchmaking
// system. It handles all socket events and maintains the matchmaking state.
//
// ## Architecture
//
// The matchmaking flow follows these steps:
// 1. User connects to matchmaking service (automatic on mount)
// 2. User joins the queue via `joinQueue()`
// 3. Service finds a match and sends `match_proposal`
// 4. User accepts/declines via `acceptMatch()`/`declineMatch()`
// 5. If both accept, `match_confirmed` is received with gameId
// 6. Component navigates to game with gameId
//
// ## Events Received from Server
//
// - `queue_joined`: Confirmation that user joined the queue
// - `queue_left`: Confirmation that user left the queue
// - `queue_stats`: Current queue statistics (size, pending)
// - `match_proposal`: A match was found, awaiting acceptance
// - `match_confirmed`: Both players accepted, game is ready
// - `match_cancelled`: Match was cancelled (opponent declined/timeout)
// - `match_failed`: Game creation failed (rare, players re-queued)
// - `error`: Server-side error message
//
// ## Events Sent to Server
//
// - `join_queue`: Request to join the matchmaking queue
// - `leave_queue`: Request to leave the queue
// - `accept_match`: Accept a match proposal
// - `decline_match`: Decline a match proposal
//
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'my-react';
import { matchmakingSocket } from '../libs/socket';
import { useAuth } from './useAuth';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Represents the current state of the matchmaking process.
 *
 * State machine:
 * IDLE -> SEARCHING (joinQueue) -> MATCH_FOUND (match_proposal)
 *      -> WAITING_OPPONENT (acceptMatch) -> MATCH_CONFIRMED (match_confirmed)
 *      -> IDLE (match_cancelled | declineMatch)
 */
export type MatchmakingStatus =
	| 'IDLE' // Not in queue, not in a match process
	| 'CONNECTING' // Connecting to matchmaking service
	| 'SEARCHING' // In queue, waiting for a match
	| 'MATCH_FOUND' // Match proposal received, waiting for user decision
	| 'WAITING_OPPONENT' // User accepted, waiting for opponent
	| 'MATCH_CONFIRMED' // Both players accepted, redirecting to game
	| 'ERROR'; // An error occurred

/**
 * Match proposal data received from the server.
 */
export interface MatchProposal {
	matchId: string;
	playerElo: number;
	opponentElo: number;
	expiresAt: number; // Unix timestamp when the proposal expires
}

/**
 * Queue statistics broadcasted by the server.
 */
export interface QueueStats {
	size: number; // Number of players currently in queue
	pending: number; // Number of matches awaiting confirmation
}

/**
 * Data received when a match is confirmed.
 */
export interface MatchConfirmedData {
	gameId: string;
	player1Id: string;
	player2Id: string;
}

/**
 * Error data structure from the server.
 */
interface ServerError {
	message: string;
	details?: unknown;
}

/**
 * Return type for the useMatchmaking hook.
 */
export interface UseMatchmakingReturn {
	// Connection state
	connected: boolean;
	status: MatchmakingStatus;

	// Match data
	currentProposal: MatchProposal | null;
	confirmedMatch: MatchConfirmedData | null;
	queueStats: QueueStats | null;

	// Timer for match acceptance
	remainingTime: number | null;

	// Error handling
	error: string | null;

	// Actions
	joinQueue: () => void;
	leaveQueue: () => void;
	acceptMatch: () => void;
	declineMatch: () => void;
	resetState: () => void;
}

// -----------------------------------------------------------------------------
// Hook Implementation
// -----------------------------------------------------------------------------

/**
 * Hook for managing matchmaking state and socket communication.
 *
 * @returns An object containing matchmaking state and action handlers
 *
 * @example
 * ```tsx
 * function MatchmakingComponent() {
 *   const {
 *     connected,
 *     status,
 *     currentProposal,
 *     remainingTime,
 *     joinQueue,
 *     acceptMatch,
 *     declineMatch,
 *   } = useMatchmaking();
 *
 *   return (
 *     <div>
 *       {status === 'IDLE' && (
 *         <button onClick={joinQueue}>Find Match</button>
 *       )}
 *       {status === 'MATCH_FOUND' && currentProposal && (
 *         <div>
 *           <p>Match found! Opponent ELO: {currentProposal.opponentElo}</p>
 *           <p>Time remaining: {remainingTime}s</p>
 *           <button onClick={acceptMatch}>Accept</button>
 *           <button onClick={declineMatch}>Decline</button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMatchmaking(): UseMatchmakingReturn {
	const { user, isAuthenticated } = useAuth();

	// Connection state
	const [connected, setConnected] = useState(false);
	const [status, setStatus] = useState<MatchmakingStatus>('IDLE');

	// Match data
	const [currentProposal, setCurrentProposal] = useState<MatchProposal | null>(null);
	const [confirmedMatch, setConfirmedMatch] = useState<MatchConfirmedData | null>(null);
	const [queueStats, setQueueStats] = useState<QueueStats | null>(null);

	// Timer state for match acceptance countdown
	const [remainingTime, setRemainingTime] = useState<number | null>(null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Error state
	const [error, setError] = useState<string | null>(null);

	// Connection guard to prevent multiple connections
	const isConnectingRef = useRef(false);

	// -------------------------------------------------------------------------
	// Timer Management
	// -------------------------------------------------------------------------

	/**
	 * Starts the countdown timer for match acceptance.
	 * Updates every second until the proposal expires.
	 */
	const startAcceptanceTimer = useCallback((expiresAt: number) => {
		// Clear any existing timer
		if (timerRef.current) {
			clearInterval(timerRef.current);
		}

		// Calculate initial remaining time
		const updateRemainingTime = () => {
			const now = Date.now();
			const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));
			setRemainingTime(remaining);

			// If time is up, the server will handle the timeout
			if (remaining <= 0 && timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		};

		// Update immediately and then every second
		updateRemainingTime();
		timerRef.current = setInterval(updateRemainingTime, 1000);
	}, []);

	/**
	 * Stops the countdown timer.
	 */
	const stopAcceptanceTimer = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		setRemainingTime(null);
	}, []);

	// -------------------------------------------------------------------------
	// Socket Connection Management
	// -------------------------------------------------------------------------

	/**
	 * Establishes the WebSocket connection to the matchmaking service.
	 * Connection is only established for authenticated users with usernames.
	 */
	useEffect(() => {
		// Guard: Only connect if authenticated with a complete profile
		if (!isAuthenticated || !user || user.noUsername) {
			return;
		}

		// Guard: Prevent multiple simultaneous connection attempts
		if (isConnectingRef.current) {
			return;
		}

		isConnectingRef.current = true;
		setStatus('CONNECTING');

		// Configure socket authentication
		matchmakingSocket.auth = {
			userId: String(user.id),
			username: user.username,
		};

		// Establish connection
		matchmakingSocket.connect();

		// Cleanup on unmount or auth change
		return () => {
			if (matchmakingSocket.connected) {
				matchmakingSocket.disconnect();
			}
			isConnectingRef.current = false;
			stopAcceptanceTimer();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated, user?.id, user?.username, user?.noUsername, stopAcceptanceTimer]);

	// -------------------------------------------------------------------------
	// Socket Event Handlers
	// -------------------------------------------------------------------------

	useEffect(() => {
		// --- Connection Events ---

		const handleConnect = () => {
			console.info('[useMatchmaking] Connected to matchmaking service');
			setConnected(true);
			setStatus('IDLE');
			setError(null);
		};

		const handleDisconnect = () => {
			console.info('[useMatchmaking] Disconnected from matchmaking service');
			setConnected(false);
			setStatus('IDLE');
			setCurrentProposal(null);
			stopAcceptanceTimer();
			// Reset connection guard to allow reconnection attempts
			isConnectingRef.current = false;
		};

		const handleConnectError = async (err: Error) => {
			console.error('[useMatchmaking] Connection error:', err.message);

			// Si l'erreur est liée à l'authentification, tenter un refresh
			/* if (isAuthError(err)) {
				console.info('[useMatchmaking] Auth error detected, attempting token refresh...');
				const refreshed = await refreshAndReconnectSockets();

				if (refreshed) {
					// Token refreshé, retenter la connexion
					console.info('[useMatchmaking] Token refreshed, retrying connection...');
					setTimeout(() => {
						if (!matchmakingSocket.connected) {
							matchmakingSocket.connect();
						}
					}, 500);
					return;
				}
			} */

			setConnected(false);
			setStatus('ERROR');
			setError(`Connection failed: ${err.message}`);
			isConnectingRef.current = false;
		};

		// --- Queue Events ---

		const handleQueueJoined = (data: { userId: string; elo: number; timestamp: number }) => {
			console.info('[useMatchmaking] Joined queue:', data);
			setStatus('SEARCHING');
			setError(null);
		};

		const handleQueueLeft = (data: { userId: string; timestamp: number }) => {
			console.info('[useMatchmaking] Left queue:', data);
			setStatus('IDLE');
		};

		const handleQueueStats = (stats: QueueStats) => {
			setQueueStats(stats);
		};

		// --- Match Events ---

		const handleMatchProposal = (proposal: MatchProposal) => {
			console.info('[useMatchmaking] Match proposal received:', proposal);
			setStatus('MATCH_FOUND');
			setCurrentProposal(proposal);
			startAcceptanceTimer(proposal.expiresAt);
		};

		const handleMatchConfirmed = (data: MatchConfirmedData) => {
			console.info('[useMatchmaking] Match confirmed:', data);
			setStatus('MATCH_CONFIRMED');
			setConfirmedMatch(data);
			setCurrentProposal(null);
			stopAcceptanceTimer();
		};

		const handleMatchCancelled = (data: { reason: string; matchId: string }) => {
			console.info('[useMatchmaking] Match cancelled:', data);

			// Reset to appropriate state based on reason
			if (data.reason === 'opponent_declined') {
				// Player was innocent, they'll be re-queued automatically
				setStatus('SEARCHING');
			} else if (data.reason === 'penalty_applied') {
				// Player was penalized
				setStatus('IDLE');
				setError('You have been penalized for not responding in time.');
			} else {
				setStatus('IDLE');
			}

			setCurrentProposal(null);
			stopAcceptanceTimer();
		};

		const handleMatchFailed = (data: { matchId: string; reason: string; errorCode: string; message: string }) => {
			console.error('[useMatchmaking] Match failed:', data);
			// Players are re-queued automatically by the server
			setStatus('SEARCHING');
			setCurrentProposal(null);
			stopAcceptanceTimer();
			setError(`Match creation failed: ${data.message}`);
		};

		// --- Error Events ---

		const handleError = (data: ServerError) => {
			console.error('[useMatchmaking] Server error:', data);
			setError(data.message);

			// Reset to IDLE on critical errors
			if (
				data.message.includes('banned') ||
				data.message.includes('already in queue') ||
				data.message.includes('already in a pending match')
			) {
				setStatus('IDLE');
			}
		};

		// Register all event listeners
		matchmakingSocket.on('connect', handleConnect);
		matchmakingSocket.on('disconnect', handleDisconnect);
		matchmakingSocket.on('connect_error', handleConnectError);
		matchmakingSocket.on('queue_joined', handleQueueJoined);
		matchmakingSocket.on('queue_left', handleQueueLeft);
		matchmakingSocket.on('queue_stats', handleQueueStats);
		matchmakingSocket.on('match_proposal', handleMatchProposal);
		matchmakingSocket.on('match_confirmed', handleMatchConfirmed);
		matchmakingSocket.on('match_cancelled', handleMatchCancelled);
		matchmakingSocket.on('match_failed', handleMatchFailed);
		matchmakingSocket.on('error', handleError);

		// IMPORTANT: Check if socket is already connected when handlers are attached.
		// This handles the case where the component mounts after the socket has already
		// connected (e.g., after HMR or fast navigation), preventing the button from
		// staying disabled because the 'connect' event was missed.
		if (matchmakingSocket.connected) {
			console.info('[useMatchmaking] Socket already connected on mount');
			setConnected(true);
			setStatus('IDLE');
			setError(null);
		}

		// Cleanup: Remove all event listeners
		return () => {
			matchmakingSocket.off('connect', handleConnect);
			matchmakingSocket.off('disconnect', handleDisconnect);
			matchmakingSocket.off('connect_error', handleConnectError);
			matchmakingSocket.off('queue_joined', handleQueueJoined);
			matchmakingSocket.off('queue_left', handleQueueLeft);
			matchmakingSocket.off('queue_stats', handleQueueStats);
			matchmakingSocket.off('match_proposal', handleMatchProposal);
			matchmakingSocket.off('match_confirmed', handleMatchConfirmed);
			matchmakingSocket.off('match_cancelled', handleMatchCancelled);
			matchmakingSocket.off('match_failed', handleMatchFailed);
			matchmakingSocket.off('error', handleError);
		};
	}, [startAcceptanceTimer, stopAcceptanceTimer]);

	// -------------------------------------------------------------------------
	// Action Handlers
	// -------------------------------------------------------------------------

	/**
	 * Joins the matchmaking queue.
	 * The server will use the ELO stored in the session.
	 */
	const joinQueue = useCallback(() => {
		console.info('[useMatchmaking] joinQueue called - connected:', connected, 'status:', status);

		if (!connected) {
			console.warn('[useMatchmaking] Cannot join queue: not connected');
			setError('Not connected to matchmaking service');
			return;
		}

		if (status !== 'IDLE') {
			console.warn('[useMatchmaking] Cannot join queue: invalid status', status);
			return;
		}

		console.info('[useMatchmaking] Joining queue...');
		matchmakingSocket.emit('join_queue', {});
	}, [connected, status]);

	/**
	 * Leaves the matchmaking queue voluntarily.
	 */
	const leaveQueue = useCallback(() => {
		if (!connected) {
			return;
		}

		if (status !== 'SEARCHING') {
			console.warn('[useMatchmaking] Cannot leave queue: not searching');
			return;
		}

		console.info('[useMatchmaking] Leaving queue...');
		matchmakingSocket.emit('leave_queue');
		setStatus('IDLE');
	}, [connected, status]);

	/**
	 * Accepts the current match proposal.
	 */
	const acceptMatch = useCallback(() => {
		if (!connected || !currentProposal) {
			return;
		}

		if (status !== 'MATCH_FOUND') {
			console.warn('[useMatchmaking] Cannot accept match: invalid status');
			return;
		}

		console.info('[useMatchmaking] Accepting match:', currentProposal.matchId);
		matchmakingSocket.emit('accept_match', { matchId: currentProposal.matchId });
		setStatus('WAITING_OPPONENT');
	}, [connected, currentProposal, status]);

	/**
	 * Declines the current match proposal.
	 * This will incur a penalty for the user.
	 */
	const declineMatch = useCallback(() => {
		if (!connected || !currentProposal) {
			return;
		}

		if (status !== 'MATCH_FOUND' && status !== 'WAITING_OPPONENT') {
			console.warn('[useMatchmaking] Cannot decline match: invalid status');
			return;
		}

		console.info('[useMatchmaking] Declining match:', currentProposal.matchId);
		matchmakingSocket.emit('decline_match', { matchId: currentProposal.matchId });
		setStatus('IDLE');
		setCurrentProposal(null);
		stopAcceptanceTimer();
	}, [connected, currentProposal, status, stopAcceptanceTimer]);

	/**
	 * Resets the matchmaking state to IDLE.
	 * Useful after a match is confirmed and the user navigates to the game.
	 */
	const resetState = useCallback(() => {
		setStatus('IDLE');
		setCurrentProposal(null);
		setConfirmedMatch(null);
		setError(null);
		stopAcceptanceTimer();
	}, [stopAcceptanceTimer]);

	// -------------------------------------------------------------------------
	// Return Value
	// -------------------------------------------------------------------------

	return {
		// Connection state
		connected,
		status,

		// Match data
		currentProposal,
		confirmedMatch,
		queueStats,

		// Timer
		remainingTime,

		// Error
		error,

		// Actions
		joinQueue,
		leaveQueue,
		acceptMatch,
		declineMatch,
		resetState,
	};
}
