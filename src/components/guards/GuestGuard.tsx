import { createElement, useEffect, Element, FragmentComponent } from 'my-react';
import { useNavigate } from 'my-react-router';
import { useAuth } from '../../hook/useAuth';

interface GuestGuardProps {
	children?: Element;
}

export function GuestGuard({ children }: GuestGuardProps) {
	const { isAuthenticated, loading } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!loading && isAuthenticated) {
			navigate('/dashboard');
		}
	}, [loading, isAuthenticated, navigate]);

	if (loading) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
			</div>
		);
	}

	if (isAuthenticated) {
		return null;
	}

	return <FragmentComponent>{children}</FragmentComponent>;
}

