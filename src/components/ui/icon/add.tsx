import { createElement } from 'my-react';

export function Add({ size = 20, className }: { size?: number; className?: string }) {
	return (
		<svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
		</svg>
	);
}
