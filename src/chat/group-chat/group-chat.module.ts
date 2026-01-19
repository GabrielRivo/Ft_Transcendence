import { Module } from 'my-fastify-decorators';
import { GroupController as GroupChatController } from './group-chat.controller.js';
import { GroupChatService } from './group-chat.service.js';

@Module({
	controllers: [GroupChatController],
	providers: [GroupChatService],
})
export class GroupChatModule {}

