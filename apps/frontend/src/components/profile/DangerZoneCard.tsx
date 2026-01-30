import { createElement } from 'my-react';
import { DangerZoneCardProps } from './types';

export function DangerZoneCard({ onDeleteClick }: DangerZoneCardProps) {
	return (
		<div className="rounded-lg border border-red-500/30 bg-slate-900/50 p-6">
			<h2 className="font-pirulen mb-4 text-xs tracking-wider text-red-500">DANGER ZONE</h2>
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-sm font-bold text-white">Delete my account</h3>
					<p className="text-xs text-gray-500">This action is irreversible</p>
				</div>
				<button
					onClick={onDeleteClick}
					className="rounded-sm border border-red-500/50 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition-all duration-300 hover:bg-red-500/20 hover:text-red-300"
				>
					Delete
				</button>
			</div>
		</div>
	);
}

