import {
    ArgumentResolutionContext,
    DelegatingArgumentListResolver,
    getRequestBodyParameters,
    HandlerContextArgumentResolverFactory,
    JsonDataConverter,
    PathArgumentResolverFactory,
    QueryArgumentResolverFactory,
    QueryObjectArgumentResolverFactory,
    RequestBodyArgumentResolverFactory,
} from '@matchmakerjs/matchmaker';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { IncomingMessage, ServerResponse } from 'node:http';

export default new DelegatingArgumentListResolver([
    new HandlerContextArgumentResolverFactory<IncomingMessage, ServerResponse>(),
    new PathArgumentResolverFactory<IncomingMessage, ServerResponse>(),
    new QueryArgumentResolverFactory<IncomingMessage, ServerResponse>(),
    new QueryObjectArgumentResolverFactory<IncomingMessage, ServerResponse>(),
    new RequestBodyArgumentResolverFactory([
        new JsonDataConverter((context: ArgumentResolutionContext<IncomingMessage, ServerResponse>, data: unknown) => {
            const type = getRequestBodyParameters(context.route)[context.paramIndex]?.type || context.paramType;
            return plainToInstance(type as ClassConstructor<unknown>, data);
        }),
    ]),
]);
