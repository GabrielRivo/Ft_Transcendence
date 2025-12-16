import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../build-app.js';

describe('AuthModule', () => {
	let app: FastifyInstance;

	beforeAll(async () => {
		app = buildApp({ dbPath: ':memory:' });
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should reject login with non-existent user', async () => {
		const response = await app.inject({
			method: 'POST',
			url: '/auth/login',
			payload: {
				email: 'doesnotexist@example.com',
				password: 'password123',
			},
		});

		expect(response.statusCode).toBe(401);
		const body = JSON.parse(response.body);
		expect(body.message).toBe('Invalid credentials');
	});

	it('should register a new user', async () => {
		const payload = {
			email: 'newuser@example.com',
			password: 'password123',
		};

		const response = await app.inject({
			method: 'POST',
			url: '/auth/register',
			payload,
		});

		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body.email).toBe(payload.email);
		expect(body.id).toBeDefined();
	});

	it('should login with registered user', async () => {
		const payload = {
			email: 'newuser@example.com',
			password: 'password123',
		};

		const response = await app.inject({
			method: 'POST',
			url: '/auth/login',
			payload,
		});

		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body.accessToken).toBeDefined();
		expect(body.refreshToken).toBeDefined();
	});
});
