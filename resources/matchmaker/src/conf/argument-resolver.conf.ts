import {
    DelegatingArgumentListResolver,
    HandlerContextArgumentResolverFactory,
    JsonDataConverter,
    PathArgumentResolverFactory,
    QueryArgumentResolverFactory,
    QueryObjectArgumentResolverFactory,
    RequestBodyArgumentResolverFactory
} from '@matchmakerjs/matchmaker';
import { IncomingMessage, ServerResponse } from 'http';

export const argumentListResolver = new DelegatingArgumentListResolver([
    new HandlerContextArgumentResolverFactory<IncomingMessage, ServerResponse>(),
    new PathArgumentResolverFactory<IncomingMessage, ServerResponse>(),
    new QueryArgumentResolverFactory<IncomingMessage, ServerResponse>(),
    new QueryObjectArgumentResolverFactory<IncomingMessage, ServerResponse>(),
    new RequestBodyArgumentResolverFactory([
        new JsonDataConverter()
    ])
]);
