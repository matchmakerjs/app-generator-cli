import * as fs from "fs";
import * as path from "path";
import * as shell from "shelljs";
import { Arguments } from "yargs";
import { copy } from "./copy-utils";

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

    shell.exec(`npm i --prefix ${cwd} reflect-metadata @matchmakerjs/jwt-validator @matchmakerjs/di @matchmakerjs/matchmaker @matchmakerjs/matchmaker-security class-transformer class-validator`);
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

    shell.cp('-r', path.resolve(cliDir, '..', 'resources', 'matchmaker', '*'), cwd);
    await copy(path.resolve(cliDir, '..', 'resources', 'matchmaker', '.env'), path.resolve(cwd, '.env'));
}