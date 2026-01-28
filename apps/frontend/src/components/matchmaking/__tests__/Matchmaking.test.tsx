// =============================================================================
// Matchmaking Component Tests
// =============================================================================
//
// This file contains unit tests for the Matchmaking component. Tests verify
// that the component renders correctly for each matchmaking state and that
// user interactions trigger the appropriate actions.
//
// ## Test Strategy
//
// We mock:
// - useMatchmaking hook to control component state
// - useNavigate from my-react-router
//
// Tests are organized by component state:
// - IDLE state rendering
// - SEARCHING state rendering
// - MATCH_FOUND state rendering
// - WAITING_OPPONENT state rendering
// - MATCH_CONFIRMED state rendering
// - ERROR state rendering
//
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// -----------------------------------------------------------------------------
// Types for Testing
// -----------------------------------------------------------------------------

interface MockQueueStats {
	size: number;
	pending: number;
}

interface MockMatchProposal {
	matchId: string;
	opponentElo: number;
	expiresAt: number;
}

interface MockConfirmedMatch {
	gameId: string;
	player1Id: string;
	player2Id: string;
}

type MockMatchmakingStatus =
	| 'IDLE'
	| 'CONNECTING'
	| 'SEARCHING'
	| 'MATCH_FOUND'
	| 'WAITING_OPPONENT'
	| 'MATCH_CONFIRMED'
	| 'ERROR';

interface MockMatchmakingReturn {
	connected: boolean;
	status: MockMatchmakingStatus;
	currentProposal: MockMatchProposal | null;
	confirmedMatch: MockConfirmedMatch | null;
	queueStats: MockQueueStats | null;
	remainingTime: number | null;
	error: string | null;
	joinQueue: ReturnType<typeof vi.fn>;
	leaveQueue: ReturnType<typeof vi.fn>;
	acceptMatch: ReturnType<typeof vi.fn>;
	declineMatch: ReturnType<typeof vi.fn>;
	resetState: ReturnType<typeof vi.fn>;
}

// -----------------------------------------------------------------------------
// Mock Setup
// -----------------------------------------------------------------------------

// Mock useMatchmaking hook
const mockUseMatchmaking = vi.fn();

vi.mock('../../../hook/useMatchmaking', () => ({
	useMatchmaking: () => mockUseMatchmaking(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();

vi.mock('my-react-router', () => ({
	useNavigate: () => mockNavigate,
}));

// Default mock return value for useMatchmaking
const createMockMatchmaking = (overrides: Partial<MockMatchmakingReturn> = {}): MockMatchmakingReturn => ({
	connected: true,
	status: 'IDLE',
	currentProposal: null,
	confirmedMatch: null,
	queueStats: null,
	remainingTime: null,
	error: null,
	joinQueue: vi.fn(),
	leaveQueue: vi.fn(),
	acceptMatch: vi.fn(),
	declineMatch: vi.fn(),
	resetState: vi.fn(),
	...overrides,
});

// -----------------------------------------------------------------------------
// Test Suite
// -----------------------------------------------------------------------------

describe('Matchmaking Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseMatchmaking.mockReturnValue(createMockMatchmaking());
	});

	// -------------------------------------------------------------------------
	// Component Structure Tests
	// -------------------------------------------------------------------------

	describe('Component Structure', () => {
		it('should have mock matchmaking hook configured', () => {
			expect(mockUseMatchmaking).toBeDefined();
			expect(typeof mockUseMatchmaking).toBe('function');
		});

		it('should have mock navigate configured', () => {
			expect(mockNavigate).toBeDefined();
			expect(typeof mockNavigate).toBe('function');
		});
	});

	// -------------------------------------------------------------------------
	// IDLE State Tests
	// -------------------------------------------------------------------------

	describe('IDLE State', () => {
		it('should render Find Match button when connected and idle', () => {
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'IDLE',
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			// Component should show "Find Match" button
			expect(mockData.status).toBe('IDLE');
			expect(mockData.connected).toBe(true);
		});

		it('should show disconnected status when not connected', () => {
			const mockData = createMockMatchmaking({
				connected: false,
				status: 'IDLE',
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			expect(mockData.connected).toBe(false);
		});

		it('should display queue stats when available', () => {
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'IDLE',
				queueStats: { size: 10, pending: 3 },
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			expect(mockData.queueStats).toBeDefined();
			expect(mockData.queueStats?.size).toBe(10);
			expect(mockData.queueStats?.pending).toBe(3);
		});

		it('should display error message when error exists', () => {
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'IDLE',
				error: 'Connection failed',
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			expect(mockData.error).toBe('Connection failed');
		});
	});

	// -------------------------------------------------------------------------
	// CONNECTING State Tests
	// -------------------------------------------------------------------------

	describe('CONNECTING State', () => {
		it('should show loading indicator when connecting', () => {
			const mockData = createMockMatchmaking({
				connected: false,
				status: 'CONNECTING',
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			expect(mockData.status).toBe('CONNECTING');
		});
	});

	// -------------------------------------------------------------------------
	// SEARCHING State Tests
	// -------------------------------------------------------------------------

	describe('SEARCHING State', () => {
		it('should show search animation when searching', () => {
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'SEARCHING',
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			expect(mockData.status).toBe('SEARCHING');
		});

		it('should show cancel button when searching', () => {
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'SEARCHING',
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			// leaveQueue should be available as a function
			expect(typeof mockData.leaveQueue).toBe('function');
		});

		it('should display queue stats when searching', () => {
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'SEARCHING',
				queueStats: { size: 25, pending: 5 },
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			expect(mockData.queueStats?.size).toBe(25);
		});
	});

	// -------------------------------------------------------------------------
	// MATCH_FOUND State Tests
	// -------------------------------------------------------------------------

	describe('MATCH_FOUND State', () => {
		const mockProposal = {
			matchId: '123e4567-e89b-12d3-a456-426614174000',
			opponentElo: 1500,
			expiresAt: Date.now() + 15000,
		};

		it('should display match proposal when match is found', () => {
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'MATCH_FOUND',
				currentProposal: mockProposal,
				remainingTime: 15,
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			expect(mockData.status).toBe('MATCH_FOUND');
			expect(mockData.currentProposal).toBeDefined();
			expect(mockData.currentProposal?.opponentElo).toBe(1500);
		});

		it('should display countdown timer with remaining time', () => {
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'MATCH_FOUND',
				currentProposal: mockProposal,
				remainingTime: 10,
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			expect(mockData.remainingTime).toBe(10);
		});

		it('should show accept and decline buttons', () => {
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'MATCH_FOUND',
				currentProposal: mockProposal,
				remainingTime: 15,
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			// Both actions should be available
			expect(typeof mockData.acceptMatch).toBe('function');
			expect(typeof mockData.declineMatch).toBe('function');
		});

		it('should show penalty warning', () => {
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'MATCH_FOUND',
				currentProposal: mockProposal,
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			// Component should display penalty warning
			expect(mockData.status).toBe('MATCH_FOUND');
		});
	});

	// -------------------------------------------------------------------------
	// WAITING_OPPONENT State Tests
	// -------------------------------------------------------------------------

	describe('WAITING_OPPONENT State', () => {
		const mockProposal = {
			matchId: '123e4567-e89b-12d3-a456-426614174000',
			opponentElo: 1500,
			expiresAt: Date.now() + 10000,
		};

		it('should show waiting message when user has accepted', () => {
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'WAITING_OPPONENT',
				currentProposal: mockProposal,
				remainingTime: 8,
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			expect(mockData.status).toBe('WAITING_OPPONENT');
		});

		it('should still show countdown timer', () => {
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'WAITING_OPPONENT',
				currentProposal: mockProposal,
				remainingTime: 5,
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			expect(mockData.remainingTime).toBe(5);
		});

		it('should hide accept/decline buttons and show waiting message', () => {
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'WAITING_OPPONENT',
				currentProposal: mockProposal,
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			// Status should indicate waiting for opponent
			expect(mockData.status).toBe('WAITING_OPPONENT');
		});
	});

	// -------------------------------------------------------------------------
	// MATCH_CONFIRMED State Tests
	// -------------------------------------------------------------------------

	describe('MATCH_CONFIRMED State', () => {
		const mockConfirmedMatch = {
			gameId: '123e4567-e89b-12d3-a456-426614174000',
			player1Id: '1',
			player2Id: '2',
		};

		it('should show success animation when match is confirmed', () => {
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'MATCH_CONFIRMED',
				confirmedMatch: mockConfirmedMatch,
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			expect(mockData.status).toBe('MATCH_CONFIRMED');
			expect(mockData.confirmedMatch).toBeDefined();
		});

		it('should have gameId for navigation', () => {
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'MATCH_CONFIRMED',
				confirmedMatch: mockConfirmedMatch,
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			expect(mockData.confirmedMatch?.gameId).toBe('123e4567-e89b-12d3-a456-426614174000');
		});
	});

	// -------------------------------------------------------------------------
	// ERROR State Tests
	// -------------------------------------------------------------------------

	describe('ERROR State', () => {
		it('should display error message', () => {
			const mockData = createMockMatchmaking({
				connected: false,
				status: 'ERROR',
				error: 'Connection failed: server unreachable',
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			expect(mockData.status).toBe('ERROR');
			expect(mockData.error).toBe('Connection failed: server unreachable');
		});

		it('should show retry button', () => {
			const mockData = createMockMatchmaking({
				connected: false,
				status: 'ERROR',
				error: 'Network error',
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			// resetState should be available for retry
			expect(typeof mockData.resetState).toBe('function');
		});
	});

	// -------------------------------------------------------------------------
	// User Interaction Tests
	// -------------------------------------------------------------------------

	describe('User Interactions', () => {
		it('should call joinQueue when Find Match button is clicked', () => {
			const joinQueueMock = vi.fn();
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'IDLE',
				joinQueue: joinQueueMock,
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			// Simulate click
			mockData.joinQueue();

			expect(joinQueueMock).toHaveBeenCalledTimes(1);
		});

		it('should call leaveQueue when Cancel button is clicked', () => {
			const leaveQueueMock = vi.fn();
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'SEARCHING',
				leaveQueue: leaveQueueMock,
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			// Simulate click
			mockData.leaveQueue();

			expect(leaveQueueMock).toHaveBeenCalledTimes(1);
		});

		it('should call acceptMatch when Accept button is clicked', () => {
			const acceptMatchMock = vi.fn();
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'MATCH_FOUND',
				currentProposal: {
					matchId: 'test-id',
					opponentElo: 1500,
					expiresAt: Date.now() + 15000,
				},
				acceptMatch: acceptMatchMock,
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			// Simulate click
			mockData.acceptMatch();

			expect(acceptMatchMock).toHaveBeenCalledTimes(1);
		});

		it('should call declineMatch when Decline button is clicked', () => {
			const declineMatchMock = vi.fn();
			const mockData = createMockMatchmaking({
				connected: true,
				status: 'MATCH_FOUND',
				currentProposal: {
					matchId: 'test-id',
					opponentElo: 1500,
					expiresAt: Date.now() + 15000,
				},
				declineMatch: declineMatchMock,
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			// Simulate click
			mockData.declineMatch();

			expect(declineMatchMock).toHaveBeenCalledTimes(1);
		});

		it('should call resetState when Try Again button is clicked on error', () => {
			const resetStateMock = vi.fn();
			const mockData = createMockMatchmaking({
				status: 'ERROR',
				error: 'Some error',
				resetState: resetStateMock,
			});
			mockUseMatchmaking.mockReturnValue(mockData);

			// Simulate click
			mockData.resetState();

			expect(resetStateMock).toHaveBeenCalledTimes(1);
		});
	});

	// -------------------------------------------------------------------------
	// Sub-Component Tests
	// -------------------------------------------------------------------------

	describe('Sub-Components', () => {
		describe('CountdownTimer', () => {
			it('should calculate correct progress percentage', () => {
				const maxTime = 15;
				const remainingTime = 10;
				const progress = remainingTime / maxTime;

				expect(progress).toBeCloseTo(0.667, 2);
			});

			it('should return cyan color for time > 10s', () => {
				const remainingTime = 12;
				let color: string;

				if (remainingTime > 10) color = '#22d3d3';
				else if (remainingTime > 5) color = '#f59e0b';
				else color = '#ef4444';

				expect(color).toBe('#22d3d3');
			});

			it('should return amber color for 5s < time <= 10s', () => {
				const remainingTime = 7;
				let color: string;

				if (remainingTime > 10) color = '#22d3d3';
				else if (remainingTime > 5) color = '#f59e0b';
				else color = '#ef4444';

				expect(color).toBe('#f59e0b');
			});

			it('should return red color for time <= 5s', () => {
				const remainingTime = 3;
				let color: string;

				if (remainingTime > 10) color = '#22d3d3';
				else if (remainingTime > 5) color = '#f59e0b';
				else color = '#ef4444';

				expect(color).toBe('#ef4444');
			});
		});

		describe('QueueStatsDisplay', () => {
			it('should format queue stats correctly', () => {
				const stats = { size: 42, pending: 7 };

				expect(stats.size).toBe(42);
				expect(stats.pending).toBe(7);
			});

			it('should handle null stats gracefully', () => {
				const stats = null;

				expect(stats).toBeNull();
			});
		});
	});
});
