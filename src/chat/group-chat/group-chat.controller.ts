import { Controller, Get, Inject, Post, Body, BodySchema } from 'my-fastify-decorators';
import { GroupChatService } from './group-chat.service.js';
import { AddUserToGroupSchema, AddUserGroup} from './dto/add_to_group.dto.js'

const AUTH_SERVICE_URL = 'http://auth:3000';

@Controller('/group')
export class GroupChatController {

	@Inject(GroupChatService)
	private chatService!: GroupChatService;

	@Get('/group_history')
	async get_history() {
		const history = this.chatService.getGroupHistory();
		return history.reverse();
	}

	@Post('/add_user')
	@BodySchema(AddUserToGroupSchema)
	async add_user(@Body() data: AddUserGroup){
		try {
				// const response = await fetch(`${AUTH_SERVICE_URL}/auth/user-by-username/${encodeURIComponent(data.userId  )}`);
				
				// if (!response.ok) {
				// 	return { success: false, message: "User not found" };
				// }
			return this.chatService.addUserToGroup(data.groupId, data.senderId, data.userId)
			} catch (error: any) {
				return { 
					success: false,
					message: error.message || "Failed to send invitation"
				};
		}
	}

	@Get('/hello')
	async coucou(){
		return {
			message : "coucou"
		}
	}
}

// @BodySchema(InviteByUsernameSchema)
// 	async invite_by_username(@Body() data: InviteByUsernameDto) {
// 		try {
// 			const response = await fetch(`${AUTH_SERVICE_URL}/auth/user-by-username/${encodeURIComponent(data.targetUsername)}`);
			
// 			if (!response.ok) {
// 				return { success: false, message: "User not found" };
// 			}
			
// 			const targetUser = await response.json() as { id: number; username: string };
			
// 			const [blocked1, blocked2] = await Promise.all([
// 				this.blockService.is_blocked(data.userId, targetUser.id),
// 				this.blockService.is_blocked(targetUser.id, data.userId)
// 			]);
			
// 			if (blocked1) {
// 				return { success: false, message: "User blocked, can't add to friendlist" };
// 			}
// 			if (blocked2) {
// 				return { success: false, message: "You can't add this user" };
// 			}
			
// 			return this.friend_managementService.sendInvitation(data.userId, targetUser.id, data.senderUsername);
// 		} catch (error: any) {
// 			return { success: false, message: error.message || "Failed to send invitation" };
// 		}
// 	}
