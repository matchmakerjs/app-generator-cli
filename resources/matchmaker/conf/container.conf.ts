import { LazyDIContainer } from "@matchmakerjs/di";

export async function createAppContainer(): Promise<[LazyDIContainer, () => Promise<void>]> {
    const container = new LazyDIContainer({
        providers: []
    });
    return [container, null];
}