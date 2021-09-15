import { HealthChecker } from '@matchmakerjs/di';
import {
    ApiResponse,
    ErrorResponse,
    Get,
    HandlerContext,
    RestController
} from '@matchmakerjs/matchmaker';
import { AnonymousUserAllowed } from '@matchmakerjs/matchmaker-security';
import * as fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';

@AnonymousUserAllowed()
@RestController()
export class IndexController {

    constructor(private healthChecker: HealthChecker) { }

    @Get('/')
    index(context: HandlerContext<IncomingMessage, ServerResponse>): Promise<void> {
        return new Promise<void>((res, rej) => {
            try {
                const swaggerUIPath = process.env.SWAGGER_UI_PATH || './swagger-ui.html';
                fs.stat(swaggerUIPath, err => {
                    if (!err) {
                        context.response.writeHead(200, {
                            'content-type': 'text/html',
                        });
                        fs.createReadStream(swaggerUIPath).pipe(context.response);
                        return res();
                    }
                    if (err.code === 'ENOENT') return rej(new ErrorResponse(404, { message: 'Swagger UI not available' }));
                    rej(new ErrorResponse(500, { message: 'Unable to load Swagger UI' }));
                });
            } catch (error) {
                rej(error);
            }
        });
    }

    @Get('/v3/api-docs')
    apiDocs(context: HandlerContext<IncomingMessage, ServerResponse>): Promise<void> {
        return new Promise<void>((res, rej) => {
            try {
                const docsPath = process.env.API_DOC_PATH || './openapi.json';
                fs.stat(docsPath, err => {
                    if (!err) {
                        context.response.writeHead(200, {
                            'content-type': 'application/json',
                        });
                        fs.createReadStream(docsPath).pipe(context.response);
                        return res();
                    }
                    if (err.code === 'ENOENT') return rej(new ErrorResponse(404, { message: 'API docs not available' }));
                    rej(new ErrorResponse(500, { message: 'Unable to load API docs' }));
                });
            } catch (error) {
                rej(error);
            }
        });
    }

    @Get('/heartbeat')
    async heartbeat(context: HandlerContext<IncomingMessage, ServerResponse>): Promise<ApiResponse<void>> {
        if (await this.healthChecker.isHealthy()) {
            return { successful: true, message: 'Stable' };
        }
        const response = context.response;
        response.writeHead(503, {
            'content-type': 'application/json'
        });
        response.end(JSON.stringify({ successful: false, message: 'Unstable' }));
    }
}
