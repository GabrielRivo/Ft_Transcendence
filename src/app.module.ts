import { Module } from 'my-fastify-decorators';
import { TournamentModule } from './tournament/tournament.module.js';

@Module({
	// providers: [TournamentModule],
	imports: [TournamentModule],
})
export class AppModule { }
