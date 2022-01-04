import {
    DelegatingArgumentListResolver,
    HandlerContextArgumentResolverFactory,
    JsonDataConverter,
    PathArgumentResolverFactory,
    QueryArgumentResolverFactory,
    QueryObjectArgumentResolverFactory,
    RequestBodyArgumentResolverFactory
} from '@matchmakerjs/matchmaker';
import { ClassConstructor, plainToClass } from 'class-transformer';
import { IncomingMessage, ServerResponse } from 'http';

export default new DelegatingArgumentListResolver([
    new HandlerContextArgumentResolverFactory<IncomingMessage, ServerResponse>(),
    new PathArgumentResolverFactory<IncomingMessage, ServerResponse>(),
    new QueryArgumentResolverFactory<IncomingMessage, ServerResponse>(),
    new QueryObjectArgumentResolverFactory<IncomingMessage, ServerResponse>(),
    new RequestBodyArgumentResolverFactory([
        new JsonDataConverter((type: unknown, data: unknown) => plainToClass(type as ClassConstructor<unknown>, data))
    ]),
]);
