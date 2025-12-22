import { Module } from 'my-fastify-decorators';
import { MatchmakingModule } from './matchmaking/matchmaking.module.js';
import { SampleModule } from './sample/sample.module.js';

@Module({
	imports: [
	MatchmakingModule,
	SampleModule
],
})
export class AppModule {}
