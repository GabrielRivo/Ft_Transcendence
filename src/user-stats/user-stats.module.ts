import { Module } from 'my-fastify-decorators'
import { UserStatsController } from './user-stats.controller.js'
import { UserStatsService } from './user-stats.service.js'

@Module({
	imports: [],
	controllers: [UserStatsController],
	providers: [UserStatsService],
})
export class UserStatsModule {}
