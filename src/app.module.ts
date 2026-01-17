import { Module } from 'my-fastify-decorators';
import { HealthController } from './health.controller.js';
import { ParticipantModule } from './participant/participant.module.js';
import { TournamentModule } from './tournament/tournament.module.js';

@Module({
	imports: [ParticipantModule, TournamentModule],
	controllers: [HealthController],
})
export class AppModule {}
