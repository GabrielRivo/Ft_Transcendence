import { createElement, Element } from 'my-react';
import { AuthGuard } from '../components/guards';

interface AuthenticatedLayoutProps {
	children?: Element;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
	return <AuthGuard>{children}</AuthGuard>;
}

