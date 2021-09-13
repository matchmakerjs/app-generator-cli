import * as fs from "fs";
import * as path from "path";
import * as shell from "shelljs";
import { Arguments } from "yargs";

export async function addJest(options: {
    cliDir: string,
    cwd: string,
    argv: Arguments
}): Promise<void> {

    const { argv, cliDir } = options;
    let cwd = (argv.workDir as string) || options.cwd;

    if (!path.isAbsolute(cwd)) {
        cwd = path.resolve(options.cwd, cwd);
    }

    shell.exec(`npm i --prefix ${cwd} jest @types/jest ts-jest faker @types/faker -D`);

    await new Promise<void>((res, rej) => {
        const packageJsonPath = path.resolve(cwd, 'package.json');
        fs.readFile(packageJsonPath, (err, data) => {
            if (err) return rej(err);
            const packageJson = JSON.parse(data.toString());
            if (!packageJson.scripts) {
                packageJson.scripts = {};
            }
            if (packageJson.scripts.test) {
                return res();
            }
            packageJson.scripts['test'] = 'jest';
            fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), (err) => {
                if (err) return rej(err);
                res();
            });
        });
    });

    for (const resouceName of ['jest.config.js']) {
        let tsConfig = path.resolve(cwd, resouceName);
        fs.stat(tsConfig, (err) => {
            if (err?.code !== 'ENOENT') {
                return;
            }
            fs.createReadStream(path.resolve(cliDir, '..', 'resources', resouceName))
                .pipe(fs.createWriteStream(tsConfig));
        });
    }

}
