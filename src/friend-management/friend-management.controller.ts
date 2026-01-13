import { Body, BodySchema, Controller, Delete, Get, Inject, Param, Post } from 'my-fastify-decorators';
import { FriendManagementService } from './friend-management.service.js';
import { BlockManagementService } from './block-management.service.js';
import { AddFriendSchema, AddFriendDto } from './dto/addFriend.dto.js';
import { InviteByUsernameSchema, InviteByUsernameDto } from './dto/inviteByUsername.dto.js';

const AUTH_SERVICE_URL = 'http://auth:3000';

@Controller('/friend-management')
export class FriendManagementController {

	@Inject(FriendManagementService)
	private friend_managementService!: FriendManagementService;

	@Inject(BlockManagementService)
	private blockService!: BlockManagementService;

	@Post('/invite-by-username')
	@BodySchema(InviteByUsernameSchema)
	async invite_by_username(@Body() data: InviteByUsernameDto) {
		try {
			const response = await fetch(`${AUTH_SERVICE_URL}/auth/user-by-username/${encodeURIComponent(data.targetUsername)}`);
			
			if (!response.ok) {
				return { success: false, message: "User not found" };
			}
			
			const targetUser = await response.json() as { id: number; username: string };
			
			const [blocked1, blocked2] = await Promise.all([
				this.blockService.is_blocked(data.userId, targetUser.id),
				this.blockService.is_blocked(targetUser.id, data.userId)
			]);
			
			if (blocked1) {
				return { success: false, message: "User blocked, can't add to friendlist" };
			}
			if (blocked2) {
				return { success: false, message: "You can't add this user" };
			}
			
			return this.friend_managementService.sendInvitation(data.userId, targetUser.id, data.senderUsername);
		} catch (error: any) {
			return { success: false, message: error.message || "Failed to send invitation" };
		}
	}

	@Post('/invite')
	@BodySchema(AddFriendSchema)
	async send_invitation(@Body() data: AddFriendDto) {
		try {
			const [blocked1, blocked2] = await Promise.all([
				this.blockService.is_blocked(data.userId, data.otherId),
				this.blockService.is_blocked(data.otherId, data.userId)
			]);
			
			if (blocked1) {
				return { success: false, message: "User blocked, can't add to friendlist" };
			}
			if (blocked2) {
				return { success: false, message: "You can't add this user" };
			}
			return this.friend_managementService.sendInvitation(data.userId, data.otherId, 'User');
		} catch (error: any) {
			return { success: false, message: error.message };
		}
	}


	@Post('/accept')
	@BodySchema(AddFriendSchema)
	async accept_invitation(@Body() data: AddFriendDto) {
		return this.friend_managementService.acceptInvitation(data.userId, data.otherId, 'User');
	}

	@Get('/pending/:userId')
	async get_pending_invitations(@Param('userId') userId: string) {
		const pending = this.friend_managementService.getPendingInvitations(Number(userId));
		
		// get depuis Auth sim juste ne bas...
		const enrichedPending = await Promise.all(
			pending.map(async (invite) => {
				try {
					const response = await fetch(`${AUTH_SERVICE_URL}/auth/users`);
					if (response.ok) {
						const users = await response.json() as { id: number; username?: string }[];
						const sender = users.find(u => u.id === invite.userId);
						return {
							senderId: invite.userId,
							senderUsername: sender?.username || `User ${invite.userId}`,
							created_at: invite.created_at,
						};
					}
				} catch {
					// Fallback si l'appel échoue
				}
				return {
					senderId: invite.userId,
					senderUsername: `User ${invite.userId}`,
					created_at: invite.created_at,
				};
			})
		);
		
		return enrichedPending;
	}

	@Get('/friends/:userId')
	async get_friends(@Param('userId') userId: string) {
		const friendIds = this.friend_managementService.getFriends(Number(userId));
		
		// get depuis Auth
		try {
			const response = await fetch(`${AUTH_SERVICE_URL}/auth/users`);
			if (response.ok) {
				const users = await response.json() as { id: number; username?: string }[];
				return friendIds.map(friendId => {
					const friend = users.find(u => u.id === friendId);
					return {
						id: friendId,
						username: friend?.username || `User ${friendId}`,
					};
				});
			}
		} catch {
			// Fallback si l'appel échoue
		}
		
		return friendIds.map(id => ({ id, username: `User ${id}` }));
	}

	@Delete('/friend')
	@BodySchema(AddFriendSchema)
	async delete_friend(@Body() data: AddFriendDto) {
		return this.friend_managementService.deleteFromFriendlist(data.userId, data.otherId);
	}

	@Post('/block')
	@BodySchema(AddFriendSchema)
	async block_user(@Body() data: AddFriendDto) {
		this.friend_managementService.deleteFromFriendlist(data.userId, data.otherId);
		return this.blockService.block_user(data.userId, data.otherId);
	}

	@Delete('/block')
	@BodySchema(AddFriendSchema)
	async unblock_user(@Body() data: AddFriendDto) {
		return this.blockService.unblock_user(data.userId, data.otherId);
	}
}

	// @Get('/friend/:id')
	// get_friend(@Param("id") id : number){
	// 	return { 
	// 		message : `L'id v2 est ${id}`
	// 	}
	// } 
 
	
		// this.friend_managementService.delete_friend(); 


// @Inject(BlockManagementService)
// private blockService !: BlockManagementService;

// @Post('/block')
// @BodySchema(AddFriendSchema) 
//     return this.blockService.block_user(data.userId, data.otherId);
// }

// @Delete('/block')
// @BodySchema(AddFriendSchema)
// unblock(@Body() data: AddFriendDto) {
//     return this.blockService.unblock_user(data.userId, data.otherId);
// }
