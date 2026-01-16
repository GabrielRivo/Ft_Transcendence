import { Module } from 'my-fastify-decorators';
import { HealthController } from './health.controller.js';

@Module({
	imports: [],
	controllers: [HealthController],
})
export class AppModule {}
