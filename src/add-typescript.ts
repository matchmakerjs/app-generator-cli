import * as fs from "fs";
import * as path from "path";
import * as shell from "shelljs";
import { Arguments } from "yargs";
import { copy } from "./copy-utils";

export async function addTypescript(options: {
    cliDir: string,
    cwd: string,
    argv: Arguments,
    jestEnabled: boolean
}): Promise<void> {

    const { argv, cliDir } = options;
    let cwd = (argv.workDir as string) || options.cwd;

    if (!path.isAbsolute(cwd)) {
        cwd = path.resolve(options.cwd, cwd);
    }
    await new Promise<void>((res, rej) => {
        fs.stat(cwd, (err) => {
            if (err?.code === 'ENOENT') {
                shell.mkdir('-p', cwd);
            } else if (err) {
                return rej(err);
            }
            res();
        });
    });

    await new Promise<void>((res, rej) => {
        const packageJsonPath = path.resolve(cwd, 'package.json');
        fs.stat(packageJsonPath, async (err) => {
            let initialized = false;
            if (err?.code === 'ENOENT') {
                await new Promise<string>((res) => {
                    shell.exec(`npm init --prefix ${cwd} -y`, (code, stdout, stderr) => {
                        if (code != 0) return rej(stderr);
                        initialized = true;
                        res(stdout);
                    });
                });
            } else if (err) {
                return rej(err);
            }
            fs.readFile(packageJsonPath, (err, data) => {
                if (err) return rej(err);
                const packageJson = JSON.parse(data.toString());
                if (!packageJson.scripts) {
                    packageJson.scripts = {};
                }
                if (options.jestEnabled && (initialized || !packageJson.scripts['test'])) {
                    packageJson.scripts['test'] = 'jest';
                }
                packageJson.scripts['tsc'] = 'rimraf -rf dist && tsc';
                fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), (err) => {
                    if (err) return rej(err);
                    res();
                });
            });
        });
    });

    shell.exec(`npm i --prefix ${cwd} typescript @types/node rimraf -D`);
    await copy(path.resolve(cliDir, '..', 'resources', '_tsconfig.json'), path.resolve(cwd, 'tsconfig.json'));
}
