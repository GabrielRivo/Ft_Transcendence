import { Module } from 'my-fastify-decorators';
import { GroupManagementController } from './group-management.controller.js';
import { GroupManagementService } from './group-management.service.js';

@Module({
	controllers: [GroupManagementController],
	providers: [GroupManagementService],
})
export class GroupManagementModule {}

