// =============================================================================
// Socket.IO Client Configuration
// =============================================================================
//
// This module provides Socket.IO client instances for real-time communication
// with backend services through the NGINX reverse proxy.
//
// Architecture:
//   Browser -> NGINX (port 8080) -> Backend services (port 3000)
//
// Socket.IO configuration:
//   - All clients connect to the DEFAULT NAMESPACE "/" 
//   - The "path" option routes the HTTP handshake through NGINX
//   - Chat:        path="/api/chat/"        -> nginx -> chat:3000 (namespace /)
//   - Game:        path="/api/game/"        -> nginx -> game:3000 (namespace /)
//   - Matchmaking: path="/api/matchmaking/" -> nginx -> matchmaking:3000 (namespace /)
//
// IMPORTANT: The namespace is NOT in the URL! We use SOCKET_BASE_URL directly.
// The "path" option handles routing via NGINX.
//
// NGINX auth_request validates JWT before proxying to backend services.
//
// =============================================================================

import { io, Socket } from "socket.io-client";

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const SOCKET_BASE_URL: string = "http://localhost:8080";

/**
 * Default Socket.IO client options.
 * These options are shared across all socket instances.
 */
const DEFAULT_SOCKET_OPTIONS = {
	// Use WebSocket transport only (no polling fallback)
	// This is more efficient and works well with NGINX proxy
	transports: ["websocket"] as string[],

	// Don't connect automatically - let components control connection lifecycle
	autoConnect: false,

	// Reconnection settings
	reconnection: true,
	reconnectionAttempts: 5,
	reconnectionDelay: 1000,
	reconnectionDelayMax: 5000,

	// Timeout for connection attempts (ms)
	timeout: 20000,

	// Credentials for cookies (JWT in httpOnly cookie)
	withCredentials: true,
};

// -----------------------------------------------------------------------------
// Socket Instances
// -----------------------------------------------------------------------------

/**
 * Socket.IO client for the Pong game service.
 * 
 * Path: /api/game/ (routed via NGINX with auth_request)
 * Namespace: / (default - server uses @WebSocketGateway() without namespace param)
 * Used for: Real-time game state, player movements, ball position
 */
export const gameSocket: Socket = io(SOCKET_BASE_URL, {
	...DEFAULT_SOCKET_OPTIONS,
	path: "/api/game/",
});

/**
 * Socket.IO client for the chat service.
 * 
 * Path: /api/chat/ (routed via NGINX with auth_request)
 * Namespace: / (default - server uses @WebSocketGateway() without namespace param)
 * Used for: Private messages, group chats, online status
 */
export const chatSocket: Socket = io(SOCKET_BASE_URL, {
	...DEFAULT_SOCKET_OPTIONS,
	path: "/api/chat/",
});

/**
 * Socket.IO client for the matchmaking service.
 * 
 * Path: /api/matchmaking/ (routed via NGINX with auth_request)
 * Namespace: / (default - server uses @WebSocketGateway() without namespace param)
 * Used for: Queue updates, match found notifications, tournament brackets
 */
export const matchmakingSocket: Socket = io(SOCKET_BASE_URL, {
	...DEFAULT_SOCKET_OPTIONS,
	path: "/api/matchmaking/",
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
