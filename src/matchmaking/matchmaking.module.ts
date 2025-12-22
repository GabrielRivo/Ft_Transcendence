import { Module } from 'my-fastify-decorators';
import { MatchmakingController } from './matchmaking.controller.js';
import { MatchmakingService } from './matchmaking.service.js';

@Module({
	controllers: [MatchmakingController],
	providers: [MatchmakingService],
})
export class MatchmakingModule {}
