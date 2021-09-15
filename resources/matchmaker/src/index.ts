import { createContainer } from '@matchmakerjs/di';
import { startServerWithGracefulShutdown } from '@matchmakerjs/matchmaker';
import { SecureRequestListener } from '@matchmakerjs/matchmaker-security';
import argumentListResolver from './conf/argument-list-resolver';
import router from './conf/router';
import validator from './conf/validator';

const [container, onExit] = createContainer({
    modules: [],
});
startServerWithGracefulShutdown(
    SecureRequestListener(router, {
        container,
        argumentListResolver,
        validator,
    }),
    onExit,
);
