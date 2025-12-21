import { createElement } from 'my-react';
import type { Element } from 'my-react';

export function LoginLayout({ children }: { children: Element }) {
	return <div className="bg-primary flex h-screen flex-col items-center justify-center">{children}</div>;
}
