import { LazyDIContainer } from '@matchmakerjs/di';
import { JwtClaims } from '@matchmakerjs/jwt-validator';
import { SecureRequestListener } from '@matchmakerjs/matchmaker-security';
import createServer, { Server } from '@matchmakerjs/rest-assured';
import { instanceToPlain } from 'class-transformer';
import { IncomingMessage } from 'http';
import argumentListResolver from '../../src/conf/argument-list-resolver';
import router from '../../src/conf/router';
import validator from '../../src/conf/validator';

export function TestServer(container: LazyDIContainer, claims?: JwtClaims): Server {
    return createServer(
        SecureRequestListener(router, {
            container,
            argumentListResolver,
            validator,
            accessClaimsResolver: {
                getClaims: async (_: IncomingMessage) => claims,
            },
            serialize: (data: unknown) => JSON.stringify(instanceToPlain(data, { enableCircularCheck: true })),
        }),
    );
}
