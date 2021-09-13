import { LazyDIContainer } from '@matchmakerjs/di';
import { SimpleRequestHandler } from '@matchmakerjs/matchmaker';
import { RequestListener } from 'http';
import { argumentListResolver } from '../../src/conf/argument-resolver.conf';
import { router } from '../../src/conf/router.conf';
import { validator } from '../../src/conf/validator.conf';
import { LoggingRequestListener } from '../../src/logging-request-listener';

export function TestApp(container: LazyDIContainer): RequestListener {
    return LoggingRequestListener(router, new SimpleRequestHandler({
        container,
        argumentListResolver,
        validator,
    }));
}
