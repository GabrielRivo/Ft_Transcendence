import { Module } from 'my-fastify-decorators';
import { UserStatsController } from './user-stats/user-stats.controller.js';
import { UserStatsService } from './user-stats/user-stats.service.js';

@Module({
	controllers: [UserStatsController],
	providers: [UserStatsService],
	imports: [],
})

export class AppModule {}