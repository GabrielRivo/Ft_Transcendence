import { Body, BodySchema, Controller, Delete, Inject, Post } from 'my-fastify-decorators';
import { FriendManagementService } from './friend-management.service.js';
import { BlockManagementService } from './block-management.service.js';
import { AddFriendSchema, AddFriendDto } from './dto/addFriend.dto.js';

@Controller('/friend-management')
export class FriendManagementController {

	@Inject(FriendManagementService)
	private friend_managementService!: FriendManagementService

	@Inject(BlockManagementService)
	private blockService!: BlockManagementService


	@Post('/friend')
	@BodySchema(AddFriendSchema)
	add_friend(@Body() data: AddFriendDto) {
		try {
			const blocked1 = this.blockService.is_blocked(data.userId, data.otherId);
			const blocked2 = this.blockService.is_blocked(data.otherId, data.userId);
			if (blocked1 || blocked2) {
				return { 
					success: false, 
					message: "User blocked, can't add to friendlist" 
				};
			}
		return this.friend_managementService.add_friend(data.userId, data.otherId);
		} 
		catch (error: any) {
			return { success: false, message: error.message };
		}
	}

	@Delete('/friend')
	@BodySchema(AddFriendSchema)
	delete_friend(@Body() data: AddFriendDto) {
		return this.friend_managementService.delete_friend(data.userId, data.otherId)
	}


	@Post('/block')
	@BodySchema(AddFriendSchema)
	block_user(@Body() data: AddFriendDto) {
		return this.blockService.block_user(data.userId, data.otherId)
	}

	@Delete('/block')
	@BodySchema(AddFriendSchema)
	unblock_user(@Body() data: AddFriendDto) {
		return this.blockService.unblock_user(data.userId, data.otherId)
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