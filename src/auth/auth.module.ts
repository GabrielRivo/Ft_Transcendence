import { Module } from 'my-fastify-decorators';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { DbExchangeService } from './dbExchange.service.js';

@Module({
    controllers: [AuthController],
    providers: [AuthService, DbExchangeService],
})
export class AuthModule {}