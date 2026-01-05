import {
	Inject,
	SubscribeConnection,
	SubscribeDisconnection,
	WebSocketGateway,
	ConnectedSocket,
	MessageBody,
	JWTBody,
	SubscribeMessage
	
} from 'my-fastify-decorators';
import type { Socket } from 'socket.io';
import { ChatService } from './chat.service.js';

// @ConnectedSocket() client: Socket, @MessageBody() message: string, @JWTBody() user : any

@WebSocketGateway()
export class ChatGateway {
	@Inject(ChatService)
	private chatService!: ChatService;

	@SubscribeConnection()
	handleConnection(@ConnectedSocket() client: Socket) {
		console.log(`Client connected: ${client.id}`);
		client.join("hub");
	}

	@SubscribeMessage("message")
	handleMessage(@ConnectedSocket() client: Socket, @MessageBody() body : any) {


		client.broadcast.emit("message", 
			`${client.id}: a envoyer un message`
		)
		client.broadcast.to("hub").emit()
	}


	@SubscribeDisconnection()
	handleDisconnect(@ConnectedSocket() client: Socket) {
		console.log(`Client disconnected: ${client.id}`);
	}
}


// join all chat -> quand un user se connecte : connection a tout ses chans (amis, general, tournoi)
// id : id 1 + id 2
// pour le general : id 0?
// tournois : id specifique si doublons ? != historique
// regarder socket.io
