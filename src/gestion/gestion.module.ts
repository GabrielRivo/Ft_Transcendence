import { Module } from 'my-fastify-decorators';
import { GestionController } from './gestion.controller.js';
import { GestionService } from './gestion.service.js';
import { GameService } from '@/game/game.service.js';

@Module({
	controllers: [GestionController],
	providers: [GestionService, GameService],
})
export class GestionModule {}
