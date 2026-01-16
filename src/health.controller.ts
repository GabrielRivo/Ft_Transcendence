import { Controller, Get } from 'my-fastify-decorators';

@Controller('/health')
export class HealthController {
	@Get('/')
	public async getHealth() {
		return { status: 'ok' };
	}
}
