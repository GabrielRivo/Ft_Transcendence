import { Controller, Get, Inject } from 'my-fastify-decorators';
import { GestionService } from './gestion.service.js';
import { GameService } from '@/game/game.service.js';

@Controller('/game/pong')
export class GestionController {
	@Inject(GestionService)
	private gestionService!: GestionService;

	@Inject(GameService)
	private gameService!: GameService;


	@Get('/sessions')
	async getActiveSessions() {
		return this.gestionService.getActiveSessions();
	}

	@Get('/count')
	async getActiveGamesCount() {
		return this.gameService.getActiveGamesCount();
	}
}
