import config from '../config.js';

export type Provider = {
    accessTokenUrl: string;
    userInfoUrl: string;
    body: Record<string, string>;
    id: providerKeys;
}

export type providerKeys = 'github';

export type Providers = Record<providerKeys, Provider>;


export const providers = {
    github: {
        authorizationUrl: `https://github.com/login/oauth/authorize?client_id=${config.github.clientId}&redirect_uri=${config.redirectUri}`,
        accessTokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        body: {
            client_id: config.github.clientId,
            client_secret: config.github.clientSecret,
            scope: 'user:read'
        },
        id: "github",
    },
    discord: {
        authorizationUrl: `https://discord.com/oauth2/authorize?client_id=${config.discord.clientId}&redirect_uri=${config.redirectUri}&response_type=code&scope=&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fdiscord%2Fcallback&scope=identify+email`,
        accessTokenUrl: 'https://discord.com/api/oauth2/token',
        userInfoUrl: 'https://discord.com/api/users/@me?scope=identify%20email',
        body: {
            client_id: config.discord.clientId,
            client_secret: config.discord.clientSecret,
            scope: 'identify,email'
        },
        id: "discord",
    },
    // google: {
    //     authorizationUrl: `https://accounts.google.com/o/oauth2/auth?client_id=${config.google.clientId}&redirect_uri=${config.redirectUri}`,
    //     accessTokenUrl: 'https://oauth2.googleapis.com/token',
    //     userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    //     body: {
    //         client_id: config.google.clientId,
    //         client_secret: config.google.clientSecret,
    //         scope: 'email profile'
    //     },
    //     id: "google",
    // }
}

// sample github auth Redirect URI : https://github.com/login/oauth/authorize?client_id=Ov23liGNZRbnN4unSVno&redirect_uri=https://localhost:3000/auth/github/callback