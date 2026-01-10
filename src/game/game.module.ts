import { Module } from 'my-fastify-decorators';
import { GameGateway } from './game.gateway.js';
import { GameService } from './game.service.js';
import { GameController } from './game.controller.js';

@Module({
	gateways: [GameGateway],
	providers: [GameService],
	controllers: [GameController],
})
export class GameModule {}
