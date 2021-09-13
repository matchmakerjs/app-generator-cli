import * as fs from "fs";
import * as path from "path";
import * as shell from "shelljs";
import { Arguments } from "yargs";

export async function addMatchmaker(options: {
    cliDir: string,
    cwd: string,
    argv: Arguments
}): Promise<void> {

    const { argv, cliDir } = options;
    let cwd = (argv.workDir as string) || options.cwd;

    if (!path.isAbsolute(cwd)) {
        cwd = path.resolve(options.cwd, cwd);
    }

    shell.exec(`npm i --prefix ${cwd} reflect-metadata @matchmakerjs/di @matchmakerjs/matchmaker class-transformer class-validator`);
    shell.exec(`npm i --prefix ${cwd} @matchmakerjs/rest-assured @matchmakerjs/api-doc-cli dotenv ts-node nodemon -D`);

    await new Promise<void>((res, rej) => {
        const packageJsonPath = path.resolve(cwd, 'package.json');
        fs.readFile(packageJsonPath, (err, data) => {
            if (err) return rej(err);
            const packageJson = JSON.parse(data.toString());
            const scriptName = 'start';
            if (!packageJson.scripts) {
                packageJson.scripts = {};
            }
            if (packageJson.scripts[scriptName]) {
                return res();
            }
            packageJson.scripts[scriptName] = "nodemon --watch src -e ts --delay 2.5 --exec 'api-doc --input ./src/conf/router.ts --out ./openapi.json && ts-node -r dotenv/config src/index.ts'";
            fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), (err) => {
                if (err) return rej(err);
                res();
            });
        });
    });

    await copy(path.resolve(cliDir, '..', 'resources', 'matchmaker', '.env'), path.resolve(cwd, '.env'));
    await copy(path.resolve(cliDir, '..', 'resources', 'matchmaker', 'swagger-ui.html'), path.resolve(cwd, 'src', 'swagger-ui.html'));
    await copy(path.resolve(cliDir, '..', 'resources', 'matchmaker', 'app.ts'), path.resolve(cwd, 'src', 'app.ts'));
    await copy(path.resolve(cliDir, '..', 'resources', 'matchmaker', 'index.ts'), path.resolve(cwd, 'src', 'index.ts'));

    await copy(path.resolve(cliDir, '..', 'resources', 'matchmaker', 'app', 'controller', 'index.controller.ts'),
        path.resolve(cwd, 'src', 'app', 'controller', 'index.controller.ts'));
    await copy(path.resolve(cliDir, '..', 'resources', 'matchmaker', 'conf', 'container.conf.ts'),
        path.resolve(cwd, 'src', 'conf', 'container.conf.ts'));
    await copy(path.resolve(cliDir, '..', 'resources', 'matchmaker', 'conf', 'argument-resolver.conf.ts'),
        path.resolve(cwd, 'src', 'conf', 'argument-resolver.conf.ts'));
    await copy(path.resolve(cliDir, '..', 'resources', 'matchmaker', 'conf', 'validator.conf.ts'),
        path.resolve(cwd, 'src', 'conf', 'validator.conf.ts'));
    await copy(path.resolve(cliDir, '..', 'resources', 'matchmaker', 'conf', 'router.conf.ts'),
        path.resolve(cwd, 'src', 'conf', 'router.conf.ts'));
}

async function copy(source: string, dest: string): Promise<void> {
    const destParent = path.resolve(dest, '..');
    await new Promise<void>((res, rej) => {
        fs.stat(destParent, (err) => {
            if (err) {
                if (err.code !== 'ENOENT') return rej(err);
                shell.mkdir('-p', destParent);
                console.log(destParent);
            }
            res();
        });
    });
    return new Promise<void>((res, rej) => {
        fs.stat(dest, (err) => {
            if (!err) return res();
            if (err && err?.code !== 'ENOENT') return rej(err);
            try {
                fs.createReadStream(source)
                    .pipe(fs.createWriteStream(dest));
                console.log(dest);
                res();
            } catch (error) {
                rej(error);
            }
        });
    });
}
