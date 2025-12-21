import { Body, BodySchema, Controller, Delete, Get, Inject, Param, Post } from 'my-fastify-decorators';
import { FriendManagementService } from './friend-management.service.js';
import { AddFriendSchema, AddFriendDto } from './dto/addFriend.dto.js';


@Controller('/friend-management')
export class FriendManagementController {
	@Inject(FriendManagementService)
	private friend_managementService !: FriendManagementService;

	@Post('/friend')
	@BodySchema(AddFriendSchema)
	add_friend(@Body() data : AddFriendDto) {

		return this.friend_managementService.add_friend(data.userId, data.otherId);
 
			
	}
 
	// @Get('/friend/:id')
	// get_friend(@Param("id") id : number){
	// 	return { 
	// 		message : `L'id v2 est ${id}`
	// 	}
	// } 
 
	@Delete('/friend')
	delete_friend(@Body() data : {userId : number, otherId : number}) {
		// this.friend_managementService.delete_friend();
	}
}     