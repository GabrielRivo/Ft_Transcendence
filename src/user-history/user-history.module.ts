import { Module } from 'my-fastify-decorators'
import { UserHistoryController } from './user-history.controller.js'
import { UserHistoryService } from './user-history.service.js'

@Module({
	controllers: [UserHistoryController],
	providers: [UserHistoryService],
})
export class UserHistoryModule {}
