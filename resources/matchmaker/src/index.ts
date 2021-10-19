import { createContainer } from '@matchmakerjs/di';
import { addGracefulShutdown, startServer } from '@matchmakerjs/matchmaker';
import { RemoteKeyAccessClaimsValidator, SecureRequestListener } from '@matchmakerjs/matchmaker-security';
import axios from 'axios';
import * as http from 'http';
import argumentListResolver from './conf/argument-list-resolver';
import router from './conf/router';
import validator from './conf/validator';

const [container, cleanUp] = createContainer({
    modules: [],
});
const server = http.createServer(SecureRequestListener(router, {
    container,
    argumentListResolver,
    validator,
    accessClaimsResolver: RemoteKeyAccessClaimsValidator(process.env.WEB_KEY_URL, axios)
}));
addGracefulShutdown(server, cleanUp);
startServer(server);
