import {
    RequestHandlerConfig, Router,
    ROUTER_EVENTS,
    RoutingRequestListener, SimpleRequestHandler
} from '@matchmakerjs/matchmaker';
import { IncomingMessage, RequestListener } from 'http';

export const handlerActivityStarted = Symbol('handlerActivityStarted');
export const handlerActivityEnded = Symbol('handlerActivityEnded');

export function App(router: Router, config: RequestHandlerConfig): RequestListener {

    const listener = RoutingRequestListener({
        requestHandler: new SimpleRequestHandler(config),
        router
    });

    return (req, res) => {
        return new Promise<void>((resolve, reject) => {

            let handlerStarted = false;

            res.once(handlerActivityStarted, () => {
                handlerStarted = true;
            });

            res.once(handlerActivityEnded, () => {
                // webRequest.handlerActivity = activityLog;

                // webRequest.statusCode = res.statusCode;
                // webRequest.duration.end();
                resolve();


                // config.container.getInstance(EntityManager).save(webRequest).then((_) => resolve()).catch(reject);
            });

            logRouteMatchingCost(req);
            // logAccessClaimsParsingCost(req, webRequest);

            res.once('finish', () => {
                if (handlerStarted) {
                    return;
                }
                // webRequest.statusCode = res.statusCode;
                // webRequest.duration.end();
                resolve();

                // config.container.getInstance(EntityManager).save(webRequest).then((_) => resolve()).catch(reject);
            });

            listener(req, res);
        });
    };
}

function logRouteMatchingCost(req: IncomingMessage) {
    let started: bigint;
    req.once(ROUTER_EVENTS.routeMatchingStarted, () => started = process.hrtime.bigint());
    req.once(ROUTER_EVENTS.routeMatchingEnded, () => {
        if (!started) {
            return;
        }
        // webRequest.routeMatchingLoadInNs = process.hrtime.bigint() - started;
    });
}
