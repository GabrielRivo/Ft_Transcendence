import { createElement, Element } from 'my-react';
import { SetUsernameGuard } from '../components/guards';

interface SetUsernameLayoutProps {
	children?: Element;
}

export function SetUsernameLayout({ children }: SetUsernameLayoutProps) {
	return <SetUsernameGuard>{children}</SetUsernameGuard>;
}

