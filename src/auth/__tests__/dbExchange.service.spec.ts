import { jest } from '@jest/globals';
import { DbExchangeService } from '../dbExchange.service.js';
import type { ProviderKeys } from '../providers.js';

type MockStatement = {
	get: jest.Mock;
	run: jest.Mock;
	all: jest.Mock;
};

function stmt(): MockStatement {
	return {
		get: jest.fn(),
		run: jest.fn(),
		all: jest.fn(),
	};
}

describe('DbExchangeService (unit)', () => {
	let service: DbExchangeService;

	beforeEach(() => {
		service = new DbExchangeService();
	});

	it('existing() uses existingPrepare.get({ email })', async () => {
		const existingPrepare = stmt();
		existingPrepare.get.mockReturnValue({ id: 123 });
		(service as any).existingPrepare = existingPrepare;

		await expect(service.existing('a@b.com')).resolves.toEqual({ id: 123 });
		expect(existingPrepare.get).toHaveBeenCalledWith({ email: 'a@b.com' });
	});

	it('addUser() uses addUserPrepare.run({ email, password_hash })', async () => {
		const addUserPrepare = stmt();
		addUserPrepare.run.mockReturnValue({ changes: 1, lastInsertRowid: 42 });
		(service as any).addUserPrepare = addUserPrepare;

		const res = await service.addUser('a@b.com', 'hash');
		expect(addUserPrepare.run).toHaveBeenCalledWith({ email: 'a@b.com', password_hash: 'hash' });
		expect(res).toEqual({ changes: 1, lastInsertRowid: 42 });
	});

	it('getUserByEmail() uses getUserByEmailPrepare.get({ email })', async () => {
		const getUserByEmailPrepare = stmt();
		getUserByEmailPrepare.get.mockReturnValue({
			id: 1,
			email: 'a@b.com',
			password_hash: 'hash',
		});
		(service as any).getUserByEmailPrepare = getUserByEmailPrepare;

		const res = await service.getUserByEmail('a@b.com');
		expect(getUserByEmailPrepare.get).toHaveBeenCalledWith({ email: 'a@b.com' });
		expect(res).toEqual({ id: 1, email: 'a@b.com', password_hash: 'hash' });
	});

	it('getUserById() uses getUserByIdPrepare.get({ id })', async () => {
		const getUserByIdPrepare = stmt();
		getUserByIdPrepare.get.mockReturnValue({ id: 7, email: 'x@y.com', password_hash: 'h' });
		(service as any).getUserByIdPrepare = getUserByIdPrepare;

		const res = await service.getUserById(7);
		expect(getUserByIdPrepare.get).toHaveBeenCalledWith({ id: 7 });
		expect(res).toEqual({ id: 7, email: 'x@y.com', password_hash: 'h' });
	});

	it('storeRefreshToken() uses storeRefreshTokenPrepare.run({ user_id, token, expires_at })', async () => {
		const storeRefreshTokenPrepare = stmt();
		storeRefreshTokenPrepare.run.mockReturnValue({ changes: 1 });
		(service as any).storeRefreshTokenPrepare = storeRefreshTokenPrepare;

		const res = await service.storeRefreshToken(9, 't', '2025-01-01T00:00:00.000Z');
		expect(storeRefreshTokenPrepare.run).toHaveBeenCalledWith({
			user_id: 9,
			token: 't',
			expires_at: '2025-01-01T00:00:00.000Z',
		});
		expect(res).toEqual({ changes: 1 });
	});

	it('revokeRefreshToken() uses revokeRefreshTokenPrepare.run({ token })', async () => {
		const revokeRefreshTokenPrepare = stmt();
		revokeRefreshTokenPrepare.run.mockReturnValue({ changes: 1 });
		(service as any).revokeRefreshTokenPrepare = revokeRefreshTokenPrepare;

		const res = await service.revokeRefreshToken('t');
		expect(revokeRefreshTokenPrepare.run).toHaveBeenCalledWith({ token: 't' });
		expect(res).toEqual({ changes: 1 });
	});

	it('generateTokens() uses generateTokensPrepare.get({ id })', async () => {
		const generateTokensPrepare = stmt();
		generateTokensPrepare.get.mockReturnValue({ id: 2, email: 'a@b.com', password_hash: 'h' });
		(service as any).generateTokensPrepare = generateTokensPrepare;

		const res = await service.generateTokens(2);
		expect(generateTokensPrepare.get).toHaveBeenCalledWith({ id: 2 });
		expect(res).toEqual({ id: 2, email: 'a@b.com', password_hash: 'h' });
	});

	it('getRefreshToken() uses getRefreshTokenPrepare.get({ token })', async () => {
		const getRefreshTokenPrepare = stmt();
		getRefreshTokenPrepare.get.mockReturnValue({
			id: 1,
			user_id: 2,
			token: 't',
			expires_at: 'x',
			revoked: 0,
		});
		(service as any).getRefreshTokenPrepare = getRefreshTokenPrepare;

		const res = await service.getRefreshToken('t');
		expect(getRefreshTokenPrepare.get).toHaveBeenCalledWith({ token: 't' });
		expect(res).toEqual({ id: 1, user_id: 2, token: 't', expires_at: 'x', revoked: 0 });
	});

	it('getUserByProviderId() uses getUserByProviderIdPrepare.get({ provider, provider_id })', async () => {
		const getUserByProviderIdPrepare = stmt();
		getUserByProviderIdPrepare.get.mockReturnValue({ id: 1, email: 'a@b.com', password_hash: 'h' });
		(service as any).getUserByProviderIdPrepare = getUserByProviderIdPrepare;

		const provider: ProviderKeys = 'github';
		const res = await service.getUserByProviderId(provider, 'abc');
		expect(getUserByProviderIdPrepare.get).toHaveBeenCalledWith({ provider, provider_id: 'abc' });
		expect(res).toEqual({ id: 1, email: 'a@b.com', password_hash: 'h' });
	});

	it('addUserByProviderId() uses addUserByProviderIdPrepare.run({ provider, provider_id, password_hash: "" })', async () => {
		const addUserByProviderIdPrepare = stmt();
		addUserByProviderIdPrepare.run.mockReturnValue({ changes: 1, lastInsertRowid: 5 });
		(service as any).addUserByProviderIdPrepare = addUserByProviderIdPrepare;

		const provider: ProviderKeys = 'github';
		const res = await service.addUserByProviderId(provider, 'abc');
		expect(addUserByProviderIdPrepare.run).toHaveBeenCalledWith({
			provider,
			provider_id: 'abc',
			password_hash: '',
		});
		expect(res).toEqual({ changes: 1, lastInsertRowid: 5 });
	});

	it('findRefreshToken() uses findRefreshTokenPrepare.get({ token })', async () => {
		const findRefreshTokenPrepare = stmt();
		findRefreshTokenPrepare.get.mockReturnValue({
			id: 1,
			user_id: 2,
			token: 't',
			expires_at: 'x',
			revoked: 0,
		});
		(service as any).findRefreshTokenPrepare = findRefreshTokenPrepare;

		const res = await service.findRefreshToken('t');
		expect(findRefreshTokenPrepare.get).toHaveBeenCalledWith({ token: 't' });
		expect(res).toEqual({ id: 1, user_id: 2, token: 't', expires_at: 'x', revoked: 0 });
	});

	it('getAllUsers() uses getAllUsersPrepare.all({})', async () => {
		const getAllUsersPrepare = stmt();
		getAllUsersPrepare.all.mockReturnValue([
			{ id: 1, email: 'a@b.com', provider: 'github', provider_id: '1' },
		]);
		(service as any).getAllUsersPrepare = getAllUsersPrepare;

		const res = await service.getAllUsers();
		expect(getAllUsersPrepare.all).toHaveBeenCalledWith({});
		expect(res).toEqual([{ id: 1, email: 'a@b.com', provider: 'github', provider_id: '1' }]);
	});
});
