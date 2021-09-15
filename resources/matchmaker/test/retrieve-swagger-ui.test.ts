import { createContainer } from '@matchmakerjs/di';
import * as fs from 'fs';
import * as path from 'path';
import { TestServer } from './conf/test-server';

describe('swagger UI', () => {
    const [container, onExit] = createContainer({
        modules: [],
    });

    afterAll(onExit);

    it('should retrieve swagger UI', async () => {
        process.env.SWAGGER_UI_PATH = path.resolve(__dirname, '..', 'src', 'swagger-ui.html');
        const response = await TestServer(container).get(`/`);
        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('text/html');
        await new Promise<void>((res, rej) => {
            fs.readFile(process.env.SWAGGER_UI_PATH, (err, data) => {
                if (err) return rej(err);
                expect(response.body).toEqual(data);
                res();
            });
        });
    });

    it('should return 404 if swagger UI is not found', async () => {
        process.env.SWAGGER_UI_PATH = path.resolve(__dirname, '_');
        const response = await TestServer(container).get(`/`);
        expect(response.statusCode).toBe(404);
    });
});
