// =============================================================================
// Socket.IO Client Configuration
// =============================================================================
//
// This module provides Socket.IO client instances for real-time communication
// with backend services through the NGINX reverse proxy.
//
// Architecture:
//   Browser -> NGINX (port 80) -> Backend services (port 3000)
//
// The reverse proxy routes Socket.IO connections based on the namespace:
//   - /game/*        -> game service
//   - /chat/*        -> chat service
//   - /matchmaking/* -> matchmaking service
//
// =============================================================================

import { io, Socket } from "socket.io-client";

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

/**
 * Base URL for Socket.IO connections.
 * 
 * In development with NGINX reverse proxy:
 * - Uses the same origin as the page (no port specification needed)
 * - NGINX routes WebSocket connections to the appropriate backend service
 * 
 * In production:
 * - Can be configured via VITE_API_URL environment variable
 * - Falls back to current origin if not specified
 */
const SOCKET_BASE_URL: string = import.meta.env.VITE_API_URL || window.location.origin;

/**
 * Default Socket.IO client options.
 * These options are shared across all socket instances.
 */
const DEFAULT_SOCKET_OPTIONS = {
	// Use WebSocket transport only (no polling fallback)
	// This is more efficient and works well with NGINX proxy
	transports: ["websocket"] as const,

	// Don't connect automatically - let components control connection lifecycle
	autoConnect: false,

	// Reconnection settings
	reconnection: true,
	reconnectionAttempts: 5,
	reconnectionDelay: 1000,
	reconnectionDelayMax: 5000,

	// Timeout for connection attempts (ms)
	timeout: 20000,
};

// -----------------------------------------------------------------------------
// Socket Instances
// -----------------------------------------------------------------------------

/**
 * Socket.IO client for the Pong game service.
 * 
 * Namespace: /game/pong
 * Used for: Real-time game state, player movements, ball position
 * 
 * Usage:
 *   import { gameSocket } from './libs/socket';
 *   
 *   // Connect when entering game
 *   gameSocket.connect();
 *   
 *   // Listen for game events
 *   gameSocket.on('gameState', (state) => { ... });
 *   
 *   // Disconnect when leaving game
 *   gameSocket.disconnect();
 */
export const gameSocket: Socket = io(`${SOCKET_BASE_URL}/game/pong`, {
	...DEFAULT_SOCKET_OPTIONS,
	auth: {
		// TODO: Replace with actual user authentication
		userId: "game_client_1",
	},
});

/**
 * Socket.IO client for the chat service.
 * 
 * Namespace: /chat
 * Used for: Private messages, group chats, online status
 * 
 * Usage:
 *   import { chatSocket } from './libs/socket';
 *   
 *   chatSocket.connect();
 *   chatSocket.on('message', (msg) => { ... });
 *   chatSocket.emit('sendMessage', { to: 'user123', content: 'Hello!' });
 */
export const chatSocket: Socket = io(`${SOCKET_BASE_URL}/chat`, {
	...DEFAULT_SOCKET_OPTIONS,
	auth: {
		// TODO: Replace with actual user authentication
		userId: "chat_client_1",
	},
});

/**
 * Socket.IO client for the matchmaking service.
 * 
 * Namespace: /matchmaking
 * Used for: Queue updates, match found notifications, tournament brackets
 * 
 * Usage:
 *   import { matchmakingSocket } from './libs/socket';
 *   
 *   matchmakingSocket.connect();
 *   matchmakingSocket.emit('joinQueue', { mode: 'ranked' });
 *   matchmakingSocket.on('matchFound', (match) => { ... });
 */
export const matchmakingSocket: Socket = io(`${SOCKET_BASE_URL}/matchmaking`, {
	...DEFAULT_SOCKET_OPTIONS,
	auth: {
		// TODO: Replace with actual user authentication
		userId: "matchmaking_client_1",
	},
});

// -----------------------------------------------------------------------------
// Legacy Export (Backward Compatibility)
// -----------------------------------------------------------------------------

/**
 * @deprecated Use `gameSocket` instead.
 * This export is kept for backward compatibility with existing code.
 */
export const socket: Socket = gameSocket;

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

/**
 * Connect all socket instances.
 * Useful when user logs in and needs all real-time features.
 */
export function connectAllSockets(): void {
	gameSocket.connect();
	chatSocket.connect();
	matchmakingSocket.connect();
}

/**
 * Disconnect all socket instances.
 * Should be called when user logs out.
 */
export function disconnectAllSockets(): void {
	gameSocket.disconnect();
	chatSocket.disconnect();
	matchmakingSocket.disconnect();
}

/**
 * Update authentication for all socket instances.
 * Call this after user login to set proper authentication.
 * 
 * @param userId - The authenticated user's ID
 * @param token - JWT token for authentication (optional)
 */
export function updateSocketAuth(userId: string, token?: string): void {
	const auth = { userId, token };

	gameSocket.auth = auth;
	chatSocket.auth = auth;
	matchmakingSocket.auth = auth;
}
