import { LazyDIContainer } from '@matchmakerjs/di';
import { request } from '@matchmakerjs/rest-assured';
import * as fs from 'fs';
import * as path from 'path';
import { TestApp } from './conf/app';

describe('swagger UI', () => {

    const container = new LazyDIContainer({
        providers: []
    });

    it('should retrieve swagger UI', async () => {
        process.env.SWAGGER_UI_PATH = path.resolve(__dirname, '..', 'src', 'swagger-ui.html');
        const response = await request(TestApp(container)).get(`/`);
        expect(response.statusCode).toBe(200);
        await new Promise<void>((res, rej) => {
            fs.readFile(process.env.SWAGGER_UI_PATH,
                (err, data) => {
                    if (err) return rej(err);
                    expect(response.body).toEqual(data);
                    res();
                });
        });
    });

    it('should return 404 if swagger UI is not found', async () => {
        delete process.env.SWAGGER_UI_PATH;
        const response = await request(TestApp(container)).get(`/`);
        expect(response.statusCode).toBe(404);
    });
});