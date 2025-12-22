import { Controller, Get, Inject } from 'my-fastify-decorators';
import { MatchmakingService } from './matchmaking.service.js';

@Controller('/matchmaking')
export class MatchmakingController {
	@Inject(MatchmakingService)
	private matchmakingService!: MatchmakingService;

	@Get()
	helloWorld() {
		return {
			message: 'hello world',
		};
	}
}

/**
 * 
 */