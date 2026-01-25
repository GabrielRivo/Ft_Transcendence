import { Module } from 'my-fastify-decorators';
import { FriendManagementService } from './friend-management/friend-management.service.js';

@Module({
	imports: [
		FriendManagementService
	],
})
export class AppModule {}
