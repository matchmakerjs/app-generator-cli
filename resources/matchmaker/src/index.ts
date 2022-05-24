import { createContainer, DIContainerModule } from '@matchmakerjs/di';
import { CachingKeyResolver, JwtValidator, RsaJwtSignatureValidator } from '@matchmakerjs/jwt-validator';
import { addGracefulShutdown, startServer } from '@matchmakerjs/matchmaker';
import { SecureRequestListener } from '@matchmakerjs/matchmaker-security';
import { instanceToPlain } from 'class-transformer';
import * as http from 'http';
import argumentListResolver from './conf/argument-list-resolver';
import router from './conf/router';
import validator from './conf/validator';
import { BearerTokenAccessClaimsResolverWithCookieSupport } from './security/access-claims-resolver';
import { RemoteKeyResolver } from './security/remote-key-resolver';

process.on('unhandledRejection', (reason) => {
    console.error('unhandledRejection:', reason);
});

Promise.all<DIContainerModule>([]).then(modules => {
    const [container, cleanUp] = createContainer({
        modules: [
            ...modules
        ],
    });

    try {
        const keyResolver = new CachingKeyResolver(new RemoteKeyResolver(process.env.WEB_KEY_URL), {
            cacheSize: parseInt(process.env.WEB_KEY_CACHE_SIZE, 10)
        });
        const jwtValidator = new JwtValidator(
            new RsaJwtSignatureValidator(keyResolver),
            parseInt(process.env.JWT_CLOCK_SKEW_MS || '1000', 10)
        );

        const server = http.createServer(SecureRequestListener(router, {
            container,
            argumentListResolver,
            validator,
            accessClaimsResolver: new BearerTokenAccessClaimsResolverWithCookieSupport(jwtValidator),
            serialize: (data: unknown) => JSON.stringify(instanceToPlain(data, { enableCircularCheck: true }))
        }));
        addGracefulShutdown(server, cleanUp);
        startServer(server);
    } catch (error) {
        console.error(error);
        cleanUp();
    }
});
