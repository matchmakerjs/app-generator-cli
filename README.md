# Setup

Clone project and open terminal in project root to execute the following scripts

## Export github user token
`export GITHUB_USER_TOKEN=YOUR_USER_TOKEN_HERE`

## Install Dependencies
`npm i`

## Compile soure code
`npm run tsc`

## Export app-setup cli
`chmod +x dist/cli.js && npm link -f`


# Example Application

## Setup App Directory

Create app directory and optionally initialize it with `npm init`.

Create `.npmrc` file in the app directory and update its content as follows

```
@matchmakerjs:registry=https://npm.pkg.github.com/

//npm.pkg.github.com/:_authToken=${GITHUB_USER_TOKEN}
```

## App Setup
Open terminal at the app root and execute the following scripts

### Export github user token
`export GITHUB_USER_TOKEN=YOUR_USER_TOKEN_HERE`

### Generate App
`app-setup add ts ts-lint ts-jest matchmaker`

## Run App

### Execute tests
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

### Run dev server
Run `npm start` and visit `http://127.0.0.1:5000` in your browser

# Add TypeOrm Support

## Install dependencies
```
export GITHUB_USER_TOKEN=YOUR_USER_TOKEN_HERE

npm i typeorm @matchmakerjs/matchmaker-typeorm

npm i sqlite3 -D
```

## Add TypeOrm module to application container

Update src/index.ts to be as follows:

```
import { createContainer } from '@matchmakerjs/di';
import { startServerWithGracefulShutdown } from '@matchmakerjs/matchmaker';
import { SecureRequestListener } from '@matchmakerjs/matchmaker-security';
import argumentListResolver from './conf/argument-list-resolver';
import router from './conf/router';
import validator from './conf/validator';
import {
    createTypeOrmModule,
    SqliteInMemoryConnectionOptions,
    TransactionalProxyFactory
} from "@matchmakerjs/matchmaker-typeorm";

createTypeOrmModule(SqliteInMemoryConnectionOptions({
    entities: [
        'src/app/data/entities/**/*.entity.ts'
    ]
})).then((typeOrmModule) => {

    const [container, cleanUp] = createContainer({
        modules: [typeOrmModule],
        proxyFactory: TransactionalProxyFactory
    });
    startServerWithGracefulShutdown(
        SecureRequestListener(router, {
            container,
            argumentListResolver,
            validator,
        }),
        cleanUp,
    );
});
```

## Add entities to `src/app/data/entities/`

src/app/data/entities/order.entity.ts
```
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

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
}
```

src/app/data/entities/order-item.entity.ts
```
import { Exclude } from "class-transformer";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
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
}
```

## Add DTOs to `src/app/dto/request/`

src/app/dto/request/order-item.request.ts
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

src/app/dto/request/order.request.ts
```
import { Type } from "class-transformer";
import { IsDefined, IsNotEmpty, ValidateNested } from "class-validator";
import { OrderItemApiRequest } from "./order-item.request";

export class OrderApiRequest {

    @IsDefined()
    @IsNotEmpty()
    customerId: string;

    @ValidateNested()
    @Type(() => OrderItemApiRequest)
    @IsDefined()
    @IsNotEmpty()
    items: OrderItemApiRequest[]
}
```

## Add services to `src/app/services/`

src/app/services/order-item.service.ts
```
import { Injectable } from "@matchmakerjs/di";
import { EntityManager } from "typeorm";
import { OrderItem } from "../data/entities/order-item.entity";
import { Order } from "../data/entities/order.entity";
import { OrderItemApiRequest } from "../dto/request/order-item.request";

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
import { Transactional } from "@matchmakerjs/matchmaker-typeorm";
import { EntityManager } from "typeorm";
import { Order } from "../data/entities/order.entity";
import { OrderApiRequest } from "../dto/request/order.request";
import { OrderItemService } from "./order-item.service";

@Injectable()
export class OrderService {

    constructor(
        private entityManager: EntityManager,
        private orderItemService: OrderItemService) { }

    @Transactional()
    async saveOrder(request: OrderApiRequest): Promise<Order> {
        const order = new Order();
        order.customerId = request.customerId;
        order.amount = request.items.map(item => item.amount)
            .reduce((a, b) => a + b);
        await this.entityManager.save(order);
        order.items = await Promise.all(request.items.map(item => this.orderItemService.saveOrderItem(order, item)))
        return order;
    }
}
```

## Add order controller

src/app/controllers/order.controller.ts

```
import { ErrorResponse, Get, PathParameter, Post, RequestBody, RestController, Valid } from '@matchmakerjs/matchmaker';
import { AnonymousUserAllowed } from '@matchmakerjs/matchmaker-security';
import { EntityManager } from 'typeorm';
import { OrderItem } from '../data/entities/order-item.entity';
import { Order } from '../data/entities/order.entity';
import { OrderApiRequest } from '../dto/request/order.request';
import { OrderService } from "../services/order.service";

@AnonymousUserAllowed()
@RestController()
export class OrderController {

    constructor(
        private entityManager: EntityManager,
        private orderService: OrderService) { }

    @Post('orders')
    async saveOrder(@RequestBody() @Valid() request: OrderApiRequest): Promise<Order> {
        return this.orderService.saveOrder(request);
    }

    @Get('orders/:id')
    async getOrder(@PathParameter('id') id: string): Promise<Order> {
        const order = await this.entityManager.findOne(Order, id);
        if (!order) {
            throw new ErrorResponse(404, {
                message: 'Unknown order id'
            });
        }
        order.items = await this.entityManager.find(OrderItem, {
            where: {
                order
            }
        });
        return order;
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

Visit `http://127.0.0.1:5000` in your browser to see/use the new endpoints