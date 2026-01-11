import { useState, useEffect, useCallback } from 'my-react';
import { useAuth } from './useAuth';

const API_BASE = '/api/friend-management';

export interface Friend {
	id: number;
	username: string;
}

export function useFriends() {
	const { isAuthenticated, user } = useAuth();
	const [friends, setFriends] = useState<Friend[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchFriends = useCallback(async () => {
		if (!isAuthenticated || !user || user.noUsername) {
			setFriends([]);
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`${API_BASE}/friends`, {
				credentials: 'include',
			});

			if (!response.ok) {
				throw new Error('Failed to fetch friends');
			}

			const data = await response.json();
			
			// La réponse est un tableau d'IDs d'amis
			// TODO: Récupérer les usernames via le service user
			const friendsWithIds: Friend[] = Array.isArray(data)
				? data.map((friendId: number, index: number) => ({
						id: friendId,
						username: `User ${friendId}`, // Placeholder - à remplacer par l'appel au service user
					}))
				: [];

			setFriends(friendsWithIds);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error');
			setFriends([]);
		} finally {
			setLoading(false);
		}
	}, [isAuthenticated, user?.id, user?.noUsername]);

	useEffect(() => {
		fetchFriends();
	}, [fetchFriends]);

	const sendFriendInvite = useCallback(async (otherId: number): Promise<boolean> => {
		if (!user) return false;

		try {
			const response = await fetch(`${API_BASE}/invite`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ userId: user.id, otherId }),
			});

			if (!response.ok) {
				return false;
			}

			const result = await response.json();
			return result.success;
		} catch {
			return false;
		}
	}, [user?.id]);

	const acceptFriendInvite = useCallback(async (senderId: number): Promise<boolean> => {
		if (!user) return false;

		try {
			const response = await fetch(`${API_BASE}/accept`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ userId: user.id, otherId: senderId }),
			});

			if (!response.ok) {
				return false;
			}

			const result = await response.json();
			if (result.success) {
				await fetchFriends(); // Rafraîchir la liste
			}
			return result.success;
		} catch {
			return false;
		}
	}, [user?.id, fetchFriends]);

	const removeFriend = useCallback(async (friendId: number): Promise<boolean> => {
		if (!user) return false;

		try {
			const response = await fetch(`${API_BASE}/friend`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ userId: user.id, otherId: friendId }),
			});

			if (!response.ok) {
				return false;
			}

			const result = await response.json();
			if (result.success) {
				setFriends((prev) => prev.filter((f) => f.id !== friendId));
			}
			return result.success;
		} catch {
			return false;
		}
	}, [user?.id]);

	return {
		friends,
		loading,
		error,
		refreshFriends: fetchFriends,
		sendFriendInvite,
		acceptFriendInvite,
		removeFriend,
	};
}

