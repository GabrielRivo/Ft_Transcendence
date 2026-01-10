import { Body, BodySchema, Controller, Get, Inject, Post } from 'my-fastify-decorators';
import { GestionService } from './gestion.service.js';
import { GameService } from '@/game/game.service.js';
import { CreateGameSchema } from './gestion.dto.js';

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

	@Post('/createGame')
	@BodySchema(CreateGameSchema)
	async createTestGame(@Body() data: any) {
		const player1Id = data.player1Id;
		const player2Id = data.player2Id;
		const gameId = data.gameId;
		const success = this.gameService.createGame(gameId, player1Id, player2Id);
		return { success };
	}
}
