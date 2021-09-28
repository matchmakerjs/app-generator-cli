import { createContainer } from '@matchmakerjs/di';
import { startServerWithGracefulShutdown } from '@matchmakerjs/matchmaker';
import { RemoteKeyAccessClaimsValidator, SecureRequestListener } from '@matchmakerjs/matchmaker-security';
import axios from 'axios';
import argumentListResolver from './conf/argument-list-resolver';
import router from './conf/router';
import validator from './conf/validator';

const [container, cleanUp] = createContainer({
    modules: [],
});
startServerWithGracefulShutdown(
    SecureRequestListener(router, {
        container,
        argumentListResolver,
        validator,
        accessClaimsResolver: RemoteKeyAccessClaimsValidator(process.env.WEB_KEY_URL, axios)
    }),
    cleanUp,
);
