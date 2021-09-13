import { SimpleRequestHandler, startServerWithGracefulShutdown } from '@matchmakerjs/matchmaker';
import { argumentListResolver } from './conf/argument-resolver.conf';
import { createAppContainer } from './conf/container.conf';
import { router } from './conf/router.conf';
import { validator } from './conf/validator.conf';
import { LoggingRequestListener } from './logging-request-listener';

createAppContainer().then(([container, onExit]) => {
    startServerWithGracefulShutdown(LoggingRequestListener(router, new SimpleRequestHandler({
        container,
        argumentListResolver,
        validator,
    })), onExit);
});
