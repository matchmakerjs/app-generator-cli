import { KeyResolver, JsonWebKey } from '@matchmakerjs/jwt-validator';
import { request } from 'http';

export class RemoteKeyResolver implements KeyResolver {
    constructor(private webKeyUrl: string) {
        if (!webKeyUrl?.includes('{kid}')) {
            throw new Error('web key url must contain {kid}');
        }
    }

    resolve(kid: string): Promise<JsonWebKey> {
        return new Promise<JsonWebKey>((res, rej) => {
            request(this.webKeyUrl.replace('{kid}', kid), (response) => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    return rej(response);
                }

                let str = '';
                response.on('data', (chunk) => {
                    str += chunk;
                });

                response.on('end', () => {
                    try {
                        res(JSON.parse(str));
                    } catch (error) {
                        rej(error);
                    }
                });

                response.on('error', rej);
            }).end();
        });
    }
}
