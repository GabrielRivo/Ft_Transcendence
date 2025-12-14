import { HttpException, Inject, InjectPlugin, Service, UnauthorizedException } from 'my-fastify-decorators';
import config from '../config.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';
import { DbExchangeService } from './dbExchange.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { providerKeys, providers } from './providers.js';

// WARNING a rajouter dans my-fastify-decorators
class BadGatewayException extends HttpException {
	constructor(message = 'Bad Gateway', payload?: unknown) {
		super(message, 502, payload);
	}
}

@Service()
export class AuthService {

	@Inject(DbExchangeService)
	private dbExchange!: DbExchangeService;

	@InjectPlugin('jwt')
	private jwt!: any;

	async register(dto: RegisterDto) {
		const { email, password } = dto;
		
		const existing = await this.dbExchange.existing(email);
		if (existing) {
			throw new UnauthorizedException('User already exists');
		}

		const hashedPassword = await hashPassword(password);
		
		const info = await this.dbExchange.addUser(email, hashedPassword);
		
		return { id: info.lastInsertRowid, email };
	}

	async login(dto: LoginDto) {
		const { email, password } = dto;
		
		const user = await this.dbExchange.getUserByEmail(email);
		if (!user || !user.password_hash) {
			throw new UnauthorizedException('Invalid credentials');
		}

		const isValid = await verifyPassword(password, user.password_hash);
		if (!isValid) {
			throw new UnauthorizedException('Invalid credentials');
		}

		return this.generateTokens(user.id, user.email);
	}

	async getRefreshToken(refreshToken: string) {
		return this.jwt.verify(refreshToken);
	}

	async refresh(refreshToken: string) {
        try {
            this.jwt.verify(refreshToken);
        } catch (err) {
            throw new UnauthorizedException('Invalid refresh token signature');
    	}

        const storedToken = await this.dbExchange.findRefreshToken(refreshToken);
		
        if (!storedToken) {
            throw new UnauthorizedException('Invalid refresh token (not found)');
        }

        if (storedToken.revoked === 1) {
            throw new UnauthorizedException('Refresh token revoked');
        }

        if (new Date(storedToken.expires_at) < new Date()) {
            throw new UnauthorizedException('Refresh token expired');
        }

        const user = await this.dbExchange.getUserById(storedToken.user_id);
        if (!user) throw new UnauthorizedException('User not found');

        await this.dbExchange.revokeRefreshToken(refreshToken);
        return this.generateTokens(user.id, user.email);
    }

    async logout(refreshToken: string) {
        const storedToken = await this.dbExchange.findRefreshToken(refreshToken);
        
        if (storedToken) {
            await this.dbExchange.revokeRefreshToken(refreshToken);
        }
    }

	async handleCallback(code: string, provider: providerKeys) {
        const tokenRes = await fetch(providers[provider].accessTokenUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', Accept: 'application/json'},
            body: JSON.stringify({...providers[provider].body, code}),
        });

        console.log("A",tokenRes);
		if (!tokenRes.ok) throw new BadGatewayException(`${providers[provider].id} login failed`);
        
		const tokenData: any = await tokenRes.json();
        console.log("B",tokenData);
        if (tokenData.error) throw new UnauthorizedException(`${providers[provider].id} login failed`);
    
        console.log("C");
        let userRes: Response;
        if (tokenData.token_type=="bearer") {
            userRes = await fetch(providers[provider].userInfoUrl, {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
        }
        else {
            throw new BadGatewayException(`${provider} - TA OUBLIER UN TRUC POUR LE PROVIDER!`);
        }

        console.log("C");

		if (!userRes.ok) throw new BadGatewayException(`${providers[provider].id} login failed`);
        
		const userData: any = await userRes.json();
    
        let user = await this.dbExchange.getUserByProviderId(provider, String(userData.id));
        
        console.log(user,userData);
        if (!user) {
            const info = await this.dbExchange.addUserByProviderId(provider, String(userData.id));
            user = { id: Number(info.lastInsertRowid), email: userData.email, password_hash: '' };
        }

        console.log("D");

        return this.generateTokens(user.id, userData.email || ''); 
    }

    private async generateTokens(userId: number, email: string) {
        const accessToken = this.jwt.sign({ sub: userId, email }, { expiresIn: config.jwt.expiresIn });
        
        const refreshToken = this.jwt.sign({ sub: userId, type: 'refresh' }, { expiresIn: config.jwt.refreshTokenExpiresIn });

        const expiresAt = new Date(Date.now() + config.jwt.refreshTokenRotation).toISOString();

        await this.dbExchange.storeRefreshToken(userId, refreshToken, expiresAt);

        return { accessToken, refreshToken };
    }
}

