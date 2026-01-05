import { Module } from 'my-fastify-decorators';
import { FriendManagementModule } from './friend-management/friend-management.module.js';
import { MatchHistoryModule } from './match-history/match-history.module.js';
import { ChatModule } from './chat/chat.module.js';

@Module({
	imports: [
	FriendManagementModule,
	MatchHistoryModule,
	ChatModule
],
})
export class AppModule {}
