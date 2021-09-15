import { createContainer } from '@matchmakerjs/di';
import { TestServer } from './conf/test-server';

describe('Health Checker', () => {

    let result: boolean;
    const [container, onExit] = createContainer({
        modules: [
            {
                providers: [],
                isHealthy: () => Promise.resolve(result)
            }
        ]
    });

    afterAll(onExit);

    it('should return 200 OK when healthy', async () => {
        result = true;
        const response = await TestServer(container).get(`/heartbeat`);
        expect(response.statusCode).toBe(200);
    });

    it('should return 503 when unhealthy', async () => {
        result = false;
        const response = await TestServer(container).get(`/heartbeat`);
        expect(response.statusCode).toBe(503);
    });
});