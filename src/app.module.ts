import { Module } from 'my-fastify-decorators';
import { UserStatsController } from './user-stats/user-stats.controller.js';
import { UserStatsService } from './user-stats/user-stats.service.js';
import { UserHistoryModule } from './user-history/user-history.module.js';

@Module({
	controllers: [UserStatsController],
	providers: [UserStatsService],
	imports: [UserHistoryModule],
})
export class AppModule {}