import { Module } from 'my-fastify-decorators';
import { UserStatsController } from './user-stats/user-stats.controller.js';
import { UserStatsService } from './user-stats/user-stats.service.js';

import { UserHistoryController } from './user-history/user-history.controller.js'
import { UserHistoryService } from './user-history/user-history.service.js'


@Module({
	controllers: [UserStatsController, UserHistoryController],
	providers: [UserStatsService, UserHistoryService],
	imports: [],
})

export class AppModule {}