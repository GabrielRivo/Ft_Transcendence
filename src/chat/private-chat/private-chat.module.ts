import { Module } from 'my-fastify-decorators'
import { PrivateChatController } from './private-chat.controller.js'
import { PrivateChatService } from './private-chat.service.js'
import { FriendManagementController } from '../../friend-management/friend-management.controller.js'
import { FriendManagementService } from '../../friend-management/friend-management.service.js'

@Module({
	controllers: [PrivateChatController, FriendManagementController],
	providers: [PrivateChatService, FriendManagementService],
})
export class PrivateChatModule {}
