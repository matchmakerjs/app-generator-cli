import { startServerWithGracefulShutdown } from '@matchmakerjs/matchmaker';
import { SecureRequestListener } from '@matchmakerjs/matchmaker-security';
import { argumentListResolver } from './conf/argument-resolver.conf';
import { createAppContainer } from './conf/container.conf';
import { router } from './conf/router.conf';
import { validator } from './conf/validator.conf';

createAppContainer().then(([container, onExit]) => {
    startServerWithGracefulShutdown(SecureRequestListener(router, {
        container,
        argumentListResolver,
        validator,
    }), onExit);
});
