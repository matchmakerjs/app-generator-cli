import { startServerWithGracefulShutdown } from '@matchmakerjs/matchmaker';
import { App } from './app';
import { argumentListResolver } from './conf/argument-resolver.conf';
import { createAppContainer } from './conf/container.conf';
import { router } from './conf/router.conf';
import { validator } from './conf/validator.conf';

createAppContainer().then(([container, onExit]) => {
    startServerWithGracefulShutdown(App(router, {
        container,
        argumentListResolver,
        validator,
    }), onExit);
});
