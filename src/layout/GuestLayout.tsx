import { createElement, Element } from 'my-react';
import { GuestGuard } from '../components/guards';

interface GuestLayoutProps {
	children?: Element;
}

export function GuestLayout({ children }: GuestLayoutProps) {
	return <GuestGuard>{children}</GuestGuard>;
}

