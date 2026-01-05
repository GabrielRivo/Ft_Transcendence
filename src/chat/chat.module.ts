import { Module } from 'my-fastify-decorators';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';

@Module({
	gateways: [ChatGateway],
	providers: [ChatService],
})
export class ChatModule {}
