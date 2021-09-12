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
        cwd = path.join(options.cwd, cwd);
    }

    shell.exec(`npm i jest @types/jest ts-jest faker @types/faker -D -w ${cwd}`);

    await new Promise<void>((res, rej) => {
        const packageJsonPath = path.join(cwd, 'package.json');
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
            fs.writeFile(packageJsonPath, JSON.stringify(packageJson), (err) => {
                if (err) return rej(err);
                res();
            });
        });
    });

    for (const resouceName of ['jest.config.js']) {
        let tsConfig = path.join(cwd, resouceName);
        fs.stat(tsConfig, (err) => {
            if (err?.code !== 'ENOENT') {
                return;
            }
            fs.createReadStream(path.join(cliDir, '../resources', resouceName))
                .pipe(fs.createWriteStream(tsConfig));
        });
    }

}
