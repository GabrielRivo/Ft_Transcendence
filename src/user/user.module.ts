import { Module } from 'my-fastify-decorators'
import { UserController } from './user.controller.js'
import { UserGateway } from './user.gateway.js'
import { UserService } from './user.service.js'

@Module({
	controllers: [UserController],
	providers: [UserService],
	gateways: [UserGateway],
})
export class UserModule {}
