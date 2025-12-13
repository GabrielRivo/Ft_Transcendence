import { Module } from 'my-fastify-decorators';
import { AuthModule } from './auth/auth.module.js';

@Module({
	imports: [AuthModule],
})
export class AppModule {}
