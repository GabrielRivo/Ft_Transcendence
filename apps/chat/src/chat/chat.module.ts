import { Module } from 'my-fastify-decorators';
import { ChatGateway } from './chat.gateway.js';
import { GeneralChatService } from './chat.service.js';

@Module({
	controllers: [],
	gateways: [ChatGateway],
	providers: [GeneralChatService],
})
export class ChatModule {}
