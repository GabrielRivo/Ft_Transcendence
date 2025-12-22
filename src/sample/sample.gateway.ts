import {
	Inject,
	SubscribeConnection,
	SubscribeDisconnection,
	WebSocketGateway,
	JWTBody,
} from 'my-fastify-decorators';
import type { Socket } from 'socket.io';
import { SampleService } from './sample.service.js';

@WebSocketGateway()
export class SampleGateway {
	@Inject(SampleService)
	private sampleService!: SampleService;


	@SubscribeConnection()
	handleConnection(client: Socket, @JWTBody() body : {pseudo: any, id: any, elo: any}) {
		client.data.body = body;
	}

	@SubscribeDisconnection()
	handleDisconnect(client: Socket) {
		console.log(`Client disconnected: ${client.id}`);
	}
}
