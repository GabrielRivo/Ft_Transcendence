import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import config from '../config.js';

// Warning: a revoir

declare module 'fastify' {
	interface FastifyInstance {
		authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
	}
}

async function jwtPlugin(fastify: FastifyInstance) {
	fastify.register(jwt, {
		secret: config.jwt.secret,
	});

	fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			await request.jwtVerify();
		} catch (err) {
			reply.send(err);
		}
	});
}

export default fp(jwtPlugin);

