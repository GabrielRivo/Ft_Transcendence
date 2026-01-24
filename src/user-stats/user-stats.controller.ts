import {
    Controller,
    Get,
    Inject,
    Param,
} from 'my-fastify-decorators';

import { UserStatsService } from './user-stats.service.js';

@Controller('/')
export class UserStatsController { 
	@Inject(UserStatsService)
	private statsService!: UserStatsService;

	@Get('/user/:userId')
	async get_stats(@Param('userId') userId: string) {
		try {
			const stats_log = await this.statsService.getGlobalStats(Number(userId));
			if (!stats_log) return { message: "User doesn't have stats" };
			return stats_log;
		} catch (err) {
			console.error('Erreur GET stats:', err);
			return { message: 'Error' };
		}
	}

	@Get('/all-elos')
	getAllElos() {
		return this.statsService.getAllElos();
	}
}
