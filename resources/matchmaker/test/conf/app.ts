import { LazyDIContainer } from '@matchmakerjs/di';
import { JwtClaims } from '@matchmakerjs/jwt-validator';
import { SecureRequestListener } from '@matchmakerjs/matchmaker-security';
import { RequestListener } from 'http';
import { argumentListResolver } from '../../src/conf/argument-resolver.conf';
import { router } from '../../src/conf/router.conf';
import { validator } from '../../src/conf/validator.conf';

export function TestApp(container: LazyDIContainer, claims?: JwtClaims): RequestListener {
    return SecureRequestListener(router, {
        container,
        argumentListResolver,
        validator,
        accessClaimsResolver: claims ? {
            getClaims: async (_) => claims
        } : null
    });
}
