import { Module } from 'my-fastify-decorators';
import { SampleGateway } from './sample.gateway.js';
import { SampleService } from './sample.service.js';

@Module({
	gateways: [SampleGateway],
	providers: [SampleService],
})
export class SampleModule {}
