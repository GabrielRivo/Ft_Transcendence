import { createElement, FragmentComponent } from 'my-react';
import EloHistogram from '@ui/charts/EloHistogram';

export function StatisticsGeneralPage() {
	return (
		<FragmentComponent>
			<EloHistogram userElo={700} allPlayersData={[500, 500, 500, 600, 700, 1000, 1000, 1000, 1000, 1500, 1800, 1758]} />
		</FragmentComponent>
	);
}
