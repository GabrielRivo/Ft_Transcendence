import { createElement, useEffect, Element, FragmentComponent } from 'my-react';
import { useNavigate } from 'my-react-router';
import { useAuth } from '../../hook/useAuth';

interface SetUsernameGuardProps {
	children?: Element;
}

/**
 * Guard pour la page set-username
 * - Redirige vers /login si non authentifié
 * - Redirige vers /dashboard si l'utilisateur a déjà un username
 */
export function SetUsernameGuard({ children }: SetUsernameGuardProps) {
	const { isAuthenticated, user, loading } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!loading) {
			if (!isAuthenticated) {
				navigate('/login');
				return;
			}

			// Si l'utilisateur a déjà un username, rediriger vers dashboard
			if (!user?.noUsername) {
				navigate('/dashboard');
			}
		}
	}, [loading, isAuthenticated, user?.noUsername, navigate]);

	if (loading) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
			</div>
		);
	}

	if (!isAuthenticated || !user?.noUsername) {
		return null;
	}

	return <FragmentComponent>{children}</FragmentComponent>;
}

