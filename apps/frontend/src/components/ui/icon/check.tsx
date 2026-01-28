import { createElement } from 'my-react';

export function Check({ size = 20, className }: { size?: number; className?: string }) {
	return (
		<svg width={size} height={size} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
		</svg>
	);
}
