import { createElement, useState, useEffect, useCallback, Element } from 'my-react';
import { AuthContext, User } from './authContext';

const API_BASE = '/api/auth';

interface AuthProviderProps {
	children?: Element;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	const checkAuth = useCallback(async () => {
		try {
			const response = await fetch(`${API_BASE}/me`, {
				credentials: 'include',
			});

			if (!response.ok) {
				setIsAuthenticated(false);
				setUser(null);
				return;
			}

			const data = await response.json();

			if (data.authenticated && data.user) {
				setIsAuthenticated(true);
				setUser({
					id: data.user.id,
					email: data.user.email,
					username: data.user.username || '',
					noUsername: data.user.noUsername || false,
					suggestedUsername: data.user.suggestedUsername || undefined,
				});
			} else {
				setIsAuthenticated(false);
				setUser(null);
			}
		} catch {
			setIsAuthenticated(false);
			setUser(null);
		} finally {
			setLoading(false);
		}
	}, []);

	const login = useCallback(async (email: string, password: string): Promise<boolean> => {
		try {
			const response = await fetch(`${API_BASE}/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				return false;
			}

			await checkAuth();
			return true;
		} catch {
			return false;
		}
	}, [checkAuth]);

	const register = useCallback(async (email: string, password: string): Promise<boolean> => {
		try {
			const response = await fetch(`${API_BASE}/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				return false;
			}

			await checkAuth();
			return true;
		} catch {
			return false;
		}
	}, [checkAuth]);

	const setUsername = useCallback(async (username: string): Promise<boolean> => {
		try {
			const response = await fetch(`${API_BASE}/username`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ username }),
			});

			if (!response.ok) {
				return false;
			}

			await checkAuth();
			return true;
		} catch {
			return false;
		}
	}, [checkAuth]);

	const logout = useCallback(async () => {
		try {
			await fetch(`${API_BASE}/logout`, {
				method: 'POST',
				credentials: 'include',
			});
		} catch {
			// ignore errors
		} finally {
			setIsAuthenticated(false);
			setUser(null);
		}
	}, []);

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated,
				user,
				loading,
				login,
				register,
				logout,
				checkAuth,
				setUsername,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
