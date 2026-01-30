import { createElement, FragmentComponent } from 'my-react';
import { Link } from 'my-react-router';
import { ButtonStyle2 } from '@/components/ui/button/style2';
import { QuickStatsCardProps } from './types';

export function QuickStatsCard({ stats }: QuickStatsCardProps) {
	return (
		<>
			<div className="rounded-lg border border-purple-500/30 bg-slate-900/50 p-6">
				<h2 className="font-pirulen mb-4 text-xs tracking-wider text-purple-500">STATISTICS</h2>
				<div className="space-y-3">
					<div className="flex justify-between">
						<span className="text-gray-400">Victories</span>
						<span className="font-bold text-green-400">{stats?.wins}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-400">Defeats</span>
						<span className="font-bold text-red-400">{stats?.losses}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-400">Total games</span>
						<span className="font-bold text-white">{stats?.total_games}</span>
					</div>
					{stats?.winrate ? (
						<div className="mt-4 border-t border-white/10 pt-4">
							<div className="flex justify-between">
								<span className="text-gray-400">Winrate</span>
								<span className="font-bold text-cyan-400">{stats.winrate.toFixed(2)}%</span>
							</div>
							<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-700">
								<div
									className="h-full bg-linear-to-r from-cyan-500 to-purple-500 transition-all duration-500"
									style={`width: ${stats.winrate.toFixed(2)}%`}
								/>
							</div>
						</div>
					) : null}
				</div>
			</div>
			<div className="flex justify-center">
				<Link to="/statistics/general">
					<ButtonStyle2 className="bg-purple-500/50">View statistics</ButtonStyle2>
				</Link>
			</div>
		</>
	);
}

