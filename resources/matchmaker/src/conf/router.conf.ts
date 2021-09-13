import { SimpleRouter } from "@matchmakerjs/matchmaker";
import { IndexController } from "../app/controller/index.controller";

export const router = SimpleRouter.fromControllers(
    [
        IndexController
    ]
);
