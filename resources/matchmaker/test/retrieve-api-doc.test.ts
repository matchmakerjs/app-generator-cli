import { createContainer } from '@matchmakerjs/di';
import * as fs from 'fs';
import * as path from 'path';
import { TestServer } from './conf/test-server';

describe('API Doc', () => {
    const [container, cleanUp] = createContainer({
        modules: [],
    });

    afterAll(cleanUp);

    it('should retrieve api doc', async () => {
        process.env.API_DOC_PATH = path.resolve(__dirname, '..', 'src', 'swagger-ui.html');
        const response = await TestServer(container).get('/v3/api-docs');
        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('application/json');
        await new Promise<void>((res, rej) => {
            fs.readFile(process.env.API_DOC_PATH, (err, data) => {
                if (err) return rej(err);
                expect(response.body).toEqual(data);
                res();
            });
        });
    });

    it('should return 404 if api doc is not found', async () => {
        process.env.API_DOC_PATH = path.resolve(__dirname, '_');
        const response = await TestServer(container).get('/v3/api-docs');
        expect(response.statusCode).toBe(404);
    });
});
