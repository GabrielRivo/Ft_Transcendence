import { createElement } from 'my-react';

export function Cross({ size = 20, className }: { size?: number; className?: string }) {
	return (
		<svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
		</svg>
	);
}
