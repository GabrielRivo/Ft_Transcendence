import { Module } from 'my-fastify-decorators'
import { UserStatsController } from './user-stats.controller.js'
import { UserStatsService } from './user-stats.service.js'
import { UserHistoryModule } from '../user-history/user-history.module.js';

@Module({
	imports: [UserHistoryModule],
	controllers: [UserStatsController],
	providers: [UserStatsService],
})
export class UserStatsModule {}
