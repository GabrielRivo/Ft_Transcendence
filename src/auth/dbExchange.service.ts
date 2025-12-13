import type { Database, RunResult, Statement } from 'better-sqlite3';
import { InjectPlugin, Service } from 'my-fastify-decorators';
import { providerKeys } from './providers.js';

@Service()
export class DbExchangeService {
	private existingPrepare: Statement<any>;
	private addUserPrepare: Statement<any>;
	private getUserByEmailPrepare: Statement<any>;
	private getUserByIdPrepare: Statement<any>;
	private storeRefreshTokenPrepare: Statement<any>;
	private revokeRefreshTokenPrepare: Statement<any>;
	private generateTokensPrepare: Statement<any>;
	private getRefreshTokenPrepare: Statement<any>;
	private getUserByProviderIdPrepare: Statement<any>;
    private addUserByProviderIdPrepare: Statement<any>;
    private findRefreshTokenPrepare: Statement<any>;
    private getAllUsersPrepare: Statement<any>;
    @InjectPlugin('db')
	private db!: Database;

	onModuleInit() {
		this.existingPrepare = this.db.prepare('SELECT id FROM users WHERE email = @email');
		this.addUserPrepare = this.db.prepare('INSERT INTO users (email, password_hash) VALUES (@email, @password_hash)');
		this.getUserByEmailPrepare = this.db.prepare('SELECT * FROM users WHERE email = @email');
        this.getUserByIdPrepare = this.db.prepare('SELECT * FROM users WHERE id = @id');
		this.storeRefreshTokenPrepare = this.db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (@user_id, @token, @expires_at)');
		this.revokeRefreshTokenPrepare = this.db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token = @token');
		this.generateTokensPrepare = this.db.prepare('SELECT * FROM users WHERE id = @id');
		this.getRefreshTokenPrepare = this.db.prepare('SELECT * FROM refresh_tokens WHERE token = @token AND revoked = 0');
		this.getUserByProviderIdPrepare = this.db.prepare('SELECT * FROM users WHERE provider = @provider AND id = @id');
		this.addUserByProviderIdPrepare = this.db.prepare('INSERT INTO users (provider, id) VALUES (@provider, @id)');
        this.findRefreshTokenPrepare = this.db.prepare('SELECT * FROM refresh_tokens WHERE token = @token');
        this.getAllUsersPrepare = this.db.prepare('SELECT id, email, provider, provider_id FROM users');
    }

	async existing(email: string) {
		return this.existingPrepare.get({ email }) as { id: number } | undefined;
	}

	async addUser(email: string, password_hash: string) {
		return this.addUserPrepare.run({ email, password_hash }) as RunResult;
	}

	async getUserByEmail(email: string) {
		return this.getUserByEmailPrepare.get({ email }) as { id: number, email: string, password_hash: string } | undefined;
	}

    async getUserById(id: number) {
		return this.getUserByIdPrepare.get({ id }) as { id: number, email: string, password_hash: string } | undefined;
	}

	async storeRefreshToken(user_id: number, token: string, expires_at: string) {
		return this.storeRefreshTokenPrepare.run({ user_id, token, expires_at }) as RunResult;
	}

	async revokeRefreshToken(token: string) {
		return this.revokeRefreshTokenPrepare.run({ token  }) as RunResult;
	}

	async generateTokens(id: number) {
		return this.generateTokensPrepare.get({ id }) as { id: number, email: string, password_hash: string } | undefined;
	}

	async getRefreshToken(token: string) {
		return this.getRefreshTokenPrepare.get({ token }) as { id: number, user_id: number, token: string, expires_at: string, revoked: number } | undefined;
	}

    async getUserByProviderId(provider: providerKeys, id: string) {
		return this.getUserByProviderIdPrepare.get({ provider, id }) as { id: number, email: string, password_hash: string } | undefined;
	}

    async addUserByProviderId(provider: providerKeys, id: string) {
		return this.addUserByProviderIdPrepare.run({ provider, id }) as RunResult;
	}

    async findRefreshToken(token: string) {
		return this.findRefreshTokenPrepare.get({ token }) as { id: number, user_id: number, token: string, expires_at: string, revoked: number } | undefined;
	}

    async getAllUsers() {
		return this.getAllUsersPrepare.all({}) as { id: number, email: string, provider: providerKeys, provider_id: string }[] | undefined;
	}
}

