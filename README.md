# CLI Setup

Clone project and open terminal in project root to execute the following scripts

## Export github user token
`export GITHUB_USER_TOKEN=YOUR_USER_TOKEN_HERE`

## Install Dependencies
`npm i`

## Compile soure code
`npm run tsc`

## Export app-setup cli
`chmod +x dist/cli.js && npm link -f`


# Generate Application

## Setup App Directory

Create app directory and optionally initialize it with `npm init`.

Create `.npmrc` file in the app directory and update its content as follows

```
@matchmakerjs:registry=https://npm.pkg.github.com/

//npm.pkg.github.com/:_authToken=${GITHUB_USER_TOKEN}

cache=.npm-cache
```

## App Setup
Open terminal at the app root and execute the following scripts

### Export github user token
`export GITHUB_USER_TOKEN=YOUR_USER_TOKEN_HERE`

### Generate App
`app-setup add ts ts-lint ts-jest matchmaker`

## Execute tests
Update package.json to match the following if you used `npm init`.

```
{
...
"scripts": {
    "test": "jest",
    ...
},
...
}
```

Run `npm test`

## Run App
Run `npm start` and visit `http://127.0.0.1:5000` in your browser

# Add CRUD Functionality using TypeOrm

## Install dependencies
```
export GITHUB_USER_TOKEN=YOUR_USER_TOKEN_HERE

npm i typeorm @matchmakerjs/matchmaker-typeorm

npm i sqlite3 -D
```

## Add TypeOrm module to application container

Update src/index.ts to be as follows:

```
import { createContainer, DIContainerModule } from '@matchmakerjs/di';
import { JwtClaims } from '@matchmakerjs/jwt-validator';
import { addGracefulShutdown, startServer } from '@matchmakerjs/matchmaker';
import { SecureRequestListener } from '@matchmakerjs/matchmaker-security';
import {
    createTypeOrmModule,
    SqliteInMemoryConnectionOptions,
    TransactionalProxyFactory
} from "@matchmakerjs/matchmaker-typeorm";
import { instanceToPlain } from 'class-transformer';
import * as http from 'http';
import argumentListResolver from './conf/argument-list-resolver';
import router from './conf/router';
import validator from './conf/validator';

process.on('unhandledRejection', (reason) => {
    console.error('unhandledRejection:', reason);
});

Promise.all<DIContainerModule>([
    createTypeOrmModule(SqliteInMemoryConnectionOptions({
        entities: [
            'src/app/data/entities/**/*.entity.ts'
        ]
    }))
]).then(modules => {
    const [container, cleanUp] = createContainer({
        proxyFactory: TransactionalProxyFactory,
        modules: [
            ...modules
        ],
    });

    try {
        const server = http.createServer(SecureRequestListener(router, {
            container,
            argumentListResolver,
            validator,
            accessClaimsResolver: {
                getClaims: async (request: http.IncomingMessage) => {
                    // your token validation logic here
                    const userId = request.headers['x-principal-id'];
                    return userId && {
                        sub: userId
                    } as JwtClaims;
                }
            },
            serialize: (data: unknown) => JSON.stringify(instanceToPlain(data, { enableCircularCheck: true }))
        }));
        addGracefulShutdown(server, cleanUp);
        startServer(server);
    } catch (error) {
        console.error(error);
        cleanUp();
    }
});

```

## Add entities to `src/app/data/entities/`

src/app/data/entities/order.entity.ts
```
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { OrderItem } from "./order-item.entity";

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: false })
    amount: number;

    @Column({ nullable: false })
    customerId: string;

    @Column({ nullable: false })
    createdBy: string;

    items: OrderItem[];
}
```

src/app/data/entities/order-item.entity.ts
```
import { Exclude } from "class-transformer";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { Order } from "./order.entity";

@Entity()
export class OrderItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Exclude()
    @ManyToOne((type) => Order, { nullable: false })
    order: Order;

    @Column({ nullable: false })
    productId: string;

    @Column({ nullable: false })
    amount: number;

    @Exclude()
    @RelationId((item: OrderItem) => item.order)
    orderId: number;
}
```

## Add DTOs to `src/app/dto/request/`

src/app/data/dto/requests/order-item.request.ts
```
import { IsDefined, IsNotEmpty, Min } from "class-validator";

export class OrderItemApiRequest {

    @IsDefined()
    @IsNotEmpty()
    productId: string;

    @IsDefined()
    @IsNotEmpty()
    @Min(0.01)
    amount: number;
}
```

src/app/data/dto/requests/order.request.ts
```
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsDefined, IsNotEmpty, ValidateNested } from "class-validator";
import { OrderItemApiRequest } from "./order-item.request";

export class OrderApiRequest {

    @IsDefined()
    @IsNotEmpty()
    customerId: string;

    @ValidateNested()
    @Type(() => OrderItemApiRequest)
    @IsDefined()
    @ArrayNotEmpty()
    items: OrderItemApiRequest[]
}
```

src/app/data/dto/requests/page.request.ts
```
export class PageRequest {
    limit: number;
    offset: number;

    static getLimit(limit: number, defaultLimit: number, maxLimit?: number) {
        if (limit === null || limit === undefined) return defaultLimit;
        const val = Number(limit);
        if (val < 0) return defaultLimit;
        if (maxLimit) return Math.min(val, maxLimit);
        return val;
    }

    static getOffset(limit: number) {
        if (limit === null || limit === undefined) return 0;
        const val = Number(limit);
        return Math.max(val, 0);
    }

    static computeTotal(limit: number, offset: number, size: number) {
        const noLimit = typeof limit !== 'number';
        if (size === 0 && (offset || 0) === 0 && (noLimit || limit > 0)) {
            return 0;
        }
        if (size > 0 && (noLimit || limit > size)) {
            return size + (offset || 0);
        }
    }
}
```

src/app/data/dto/responses/search-result.ts
```
import { Type } from 'class-transformer';

export class SearchResult<T> {
    @Type(() => Number)
    limit: number;
    @Type(() => Number)
    offset: number;
    @Type(() => Number)
    total: number;
    results: T[];
}
```

## Add services to `src/app/services/`

src/app/services/order-item.service.ts
```
import { Injectable } from "@matchmakerjs/di";
import { EntityManager } from "typeorm";
import { OrderItemApiRequest } from "../data/dto/requests/order-item.request";
import { OrderItem } from "../data/entities/order-item.entity";
import { Order } from "../data/entities/order.entity";

@Injectable()
export class OrderItemService {

    constructor(private entityManager: EntityManager) { }
    
    saveOrderItem(order: Order, request: OrderItemApiRequest): Promise<OrderItem> {
        const item = new OrderItem();
        item.order = order;
        item.productId = request.productId;
        item.amount = request.amount;
        return this.entityManager.save(item);
    }
}
```

src/app/services/order.service.ts
```
import { Injectable } from "@matchmakerjs/di";
import { RequestMetadata } from "@matchmakerjs/matchmaker-security";
import { Transactional } from "@matchmakerjs/matchmaker-typeorm";
import { EntityManager } from "typeorm";
import { OrderApiRequest } from "../data/dto/requests/order.request";
import { Order } from "../data/entities/order.entity";
import { OrderItemService } from "./order-item.service";

@Injectable()
export class OrderService {

    constructor(
        private entityManager: EntityManager,
        private orderItemService: OrderItemService,
        private requestMetadata: RequestMetadata) { }

    @Transactional()
    async saveOrder(request: OrderApiRequest): Promise<Order> {
        const order = new Order();
        order.customerId = request.customerId;
        order.createdBy = this.requestMetadata.userId;
        order.amount = request.items.map(item => item.amount)
            .reduce((a, b) => a + b);
        await this.entityManager.save(order);
        order.items = await Promise.all(request.items.map(item => this.orderItemService.saveOrderItem(order, item)))
        return order;
    }
}
```

## Add controller and authorization

src/app/guards/admin.guard.ts
```
import { Injectable } from "@matchmakerjs/di";
import { RouteGuard, RouteObjection } from "@matchmakerjs/matchmaker";
import { RequestMetadata } from "@matchmakerjs/matchmaker-security";
import { IncomingMessage } from "http";

@Injectable()
export class AdminGuard implements RouteGuard<IncomingMessage> {

    constructor(private requestMetadata: RequestMetadata) { }

    async findObjection(request: IncomingMessage): Promise<RouteObjection> {
        if (this.requestMetadata.userId === '1') {
            return;
        }
        return {
            statusCode: 403
        };
    }
}
```

src/app/controllers/order.controller.ts

```
import { ErrorResponse, Get, HandlerContext, PathParameter, Post, Query, RequestBody, RestController, Valid } from '@matchmakerjs/matchmaker';
import { IfAuthorized } from '@matchmakerjs/matchmaker-security';
import { IncomingMessage, ServerResponse } from 'http';
import { EntityManager, In } from 'typeorm';
import { OrderApiRequest } from '../data/dto/requests/order.request';
import { PageRequest } from '../data/dto/requests/page-request';
import { SearchResult } from '../data/dto/responses/search-result';
import { OrderItem } from '../data/entities/order-item.entity';
import { Order } from '../data/entities/order.entity';
import { AdminGuard } from '../guards/admin.guard';
import { OrderService } from "../services/order.service";

@RestController()
export class OrderController {

    constructor(
        private entityManager: EntityManager,
        private orderService: OrderService) { }

    @Post('orders')
    async saveOrder(context: HandlerContext<IncomingMessage, ServerResponse>, @RequestBody() @Valid() request: OrderApiRequest): Promise<Order> {
        context.response.statusCode = 201;
        return this.orderService.saveOrder(request);
    }

    @Get('orders/:id:\\d+')
    async getOrder(@PathParameter('id') id: number): Promise<Order> {
        const order = await this.entityManager.findOneBy(Order, { id });
        if (!order) {
            throw new ErrorResponse(404, {
                message: 'Unknown order id'
            });
        }
        order.items = await this.entityManager.find(OrderItem, {
            where: {
                order: {
                    id: order.id
                }
            }
        });
        return order;
    }

    @IfAuthorized([AdminGuard])
    @Get('orders')
    async getOrders(@Query() request: PageRequest): Promise<SearchResult<Order>> {
        const offset = request?.offset || 0;
        const limit = request?.limit || 10;

        const [orders, total] = await this.entityManager.findAndCount(Order, {
            skip: offset,
            take: limit,
            order: { 'createdAt': 'DESC' }
        });
        const items = await this.entityManager.find(OrderItem, {
            loadRelationIds: true,
            where: {
                order: {
                    id: In(orders.map(order => order.id))
                }
            },
            order: { 'amount': 'DESC' }
        });
        orders.forEach(order => {
            order.items = items.filter(item => item.orderId === order.id);
        });
        return {
            results: orders,
            limit,
            offset,
            total
        };
    }
}
```

## Register controllers

src/conf/router.ts

```
import { SimpleRouter } from '@matchmakerjs/matchmaker';
import { IndexController } from '../app/controllers/index.controller';
import { OrderController } from '../app/controllers/order.controller';

export default SimpleRouter.fromControllers([
    IndexController,
    OrderController
]);
```

Visit `http://127.0.0.1:5000` in your browser to view/use the new endpoints

# Integration Test

.env
```
...
TYPEORM_ENTITIES=src/app/data/entities/**/*.entity.ts
```

test/suites/api/order-api.test
```
import { createContainer, LazyDIContainer } from '@matchmakerjs/di';
import { JwtClaims } from '@matchmakerjs/jwt-validator';
import { createTypeOrmModule, SqliteInMemoryConnectionOptions } from '@matchmakerjs/matchmaker-typeorm';
import * as dotenv from 'dotenv';
import { SearchResult } from '../../../src/app/data/dto/responses/search-result';
import { Order } from '../../../src/app/data/entities/order.entity';
import { TestServer } from '../../conf/test-server';

describe('Order API', () => {

    let container: LazyDIContainer;
    let cleanUp: () => void;

    beforeAll(async () => {
        dotenv.config();
        const typeOrmModule = await createTypeOrmModule(SqliteInMemoryConnectionOptions());
        [container, cleanUp] = createContainer({
            modules: [typeOrmModule]
        });
    })

    afterAll(() => cleanUp && cleanUp());

    it('should reject invalid amount', async () => {
        const response = await TestServer(container, { sub: '1' } as JwtClaims)
            .post(`/orders`,
                {
                    "customerId": "1",
                    "items": [
                        {
                            "productId": "1",
                            "amount": 0
                        }
                    ]
                });
        expect(response.statusCode).toBe(400);
    });

    it('should reject empty order items', async () => {
        const response = await TestServer(container, { sub: '1' } as JwtClaims)
            .post(`/orders`,
                {
                    "customerId": "1",
                    "items": []
                });
        expect(response.statusCode).toBe(400);
    });

    it('should reject missing order items', async () => {
        const response = await TestServer(container, { sub: '1' } as JwtClaims)
            .post(`/orders`,
                {
                    "customerId": "1",
                });
        expect(response.statusCode).toBe(400);
    });

    it('should create order', async () => {
        const response = await TestServer(container, { sub: '1' } as JwtClaims)
            .post(`/orders`,
                {
                    "customerId": "1",
                    "items": [
                        {
                            "productId": "1",
                            "amount": 10
                        }
                    ]
                });
        expect(response.statusCode).toBe(201);
    });

    it('should fetch order with items', async () => {
        const claims = { sub: '1' } as JwtClaims;
        await TestServer(container, claims)
            .post(`/orders`,
                {
                    "customerId": "1",
                    "items": [
                        {
                            "productId": "1",
                            "amount": 10
                        }
                    ]
                });
        const response = await TestServer(container, claims).get('/orders');
        expect(response.statusCode).toBe(200);
        expect((response.parseJson() as SearchResult<Order>).results[0].items.length).toBe(1);
    });
});
```
