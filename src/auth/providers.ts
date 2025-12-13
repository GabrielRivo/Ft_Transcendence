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
        accessTokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        body: {
            client_id: config.github.clientId,
            client_secret: config.github.clientSecret,
            scope: 'user:email:avatar'
        },
        id: "github",
    }
}