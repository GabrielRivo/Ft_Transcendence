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
import { Socket } from 'socket.io';
import { GeneralChatService } from './general-chat/general-chat.service.js';


@WebSocketGateway()
export class ChatGateway {
	@Inject(GeneralChatService)
	private chatService!: GeneralChatService;

	@SubscribeConnection()
	handleConnection(@ConnectedSocket() client: Socket) {
		console.log(`Client connected: ${client.id}`);
		client.join("hub");
	}

	@SubscribeMessage("message")
	handleMessage(
		@ConnectedSocket() client: Socket, 
		@MessageBody() body: any,    
		@JWTBody() user: any) 
	{
		const content = typeof body === 'string' ? body : body.content;
		if (!content || !user) return;
		this.chatService.saveGeneralMessage(user.id, content);
		client.nsp.to("hub").emit("message", {
			userId: user.id,
			username: user.username,
			msgContent: content,
			created_at: new Date().toISOString()
		});
	}

	@SubscribeDisconnection()
	handleDisconnect(@ConnectedSocket() client: Socket) {
		console.log(`Client disconnected: ${client.id}`);
	}
}



// @ConnectedSocket() client: Socket, @MessageBody() message: string, @JWTBody() user : any


// join all chat -> quand un user se connecte : connection a tout ses chans (amis, general, tournoi)
// id : id 1 + id 2
// pour le general : id 0?
// tournois : id specifique si doublons ? != historique
// regarder socket.io

// @WebSocketGateway()
// export class ChatGateway {
// 	@Inject(ChatService)
// 	private chatService!: ChatService;
	
// 	@SubscribeConnection()
// 	handleConnection(@ConnectedSocket() client: Socket) {
// 		console.log(`Client connected: ${client.id}`);
// 		client.join("hub");
// 	}
	
// 	@SubscribeMessage("message")
// 	handleMessage(@ConnectedSocket() client: Socket, @MessageBody() body : any) {
		
		
// 		client.broadcast.emit("message", 
// 			`${client.id}: a envoyer un message`
// 		)
// 		client.broadcast.to("hub").emit()
// 	}
	
	
// 	@SubscribeDisconnection()
// 	handleDisconnect(@ConnectedSocket() client: Socket) {
// 		console.log(`Client disconnected: ${client.id}`);
// 	}
// }