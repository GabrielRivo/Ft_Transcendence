import { Controller, Get, Inject, Param, Delete, Body } from 'my-fastify-decorators';
import { PrivateChatService } from './private-chat.service.js';


interface DeleteChatPayload {
	userId: number;
	otherId: number;
}


const BLOCK_URL = 'http://auth:3000';

@Controller('/chat/private')
export class PrivateChatController {

	@Inject(PrivateChatService)
	private chatService!: PrivateChatService;

	@Get('/private_history')
	async get_history(@Param('userId1') userId1: string , @Param('userId2') userId2: string)
	{	
		const res = fetch(`${BLOCK_URL}/social/friend-management/block`, 
			{
				method: 'GET',
				headers : {
					"Content-Type" : "application/json"
				},
				body : JSON.stringify({ userId1, userId2 })
			});
		// if (res == false)
		const history = await this.chatService.getPrivateHistory(Number(userId1), Number(userId2));
		return history.reverse();
	}

	@Delete('/private_history')
	async delete_history(@Body()payload: DeleteChatPayload) {
		await this.chatService.removePrivateChat(
			Number(payload.userId), 
			Number(payload.otherId)
		);
	}
}