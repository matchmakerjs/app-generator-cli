import * as fs from "fs";
import * as path from "path";
import * as shell from "shelljs";
import { Arguments } from "yargs";

export async function addTypescript(options: {
    cliDir: string,
    cwd: string,
    argv: Arguments
}): Promise<void> {

    const { argv, cliDir } = options;
    let cwd = (argv.workDir as string) || options.cwd;

    if (!path.isAbsolute(cwd)) {
        cwd = path.join(options.cwd, cwd);
    }
    fs.stat(cwd, (err) => {
        if (err?.code === 'ENOENT') {
            shell.mkdir(cwd);
        }
    });

    await new Promise<void>((res, rej) => {
        const packageJsonPath = path.join(cwd, 'package.json');
        fs.stat(packageJsonPath, (err) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    shell.exec(`npm init -y -w ${cwd}`);
                } else {
                    return rej(err);
                }
            };
            fs.readFile(packageJsonPath, (err, data) => {
                if (err) return rej(err);
                const packageJson = JSON.parse(data.toString());
                if (!packageJson.scripts) {
                    packageJson.scripts = {};
                }
                packageJson.scripts['tsc'] = 'rimraf -rf dist && tsc';
                fs.writeFile(packageJsonPath, JSON.stringify(packageJson), (err) => {
                    if (err) return rej(err);
                    res();
                });
            });
        });
    });

    let tsConfig = path.join(cwd, 'tsconfig.json');
    shell.exec(`npm i typescript @types/node rimraf -D -w ${cwd}`);
    fs.stat(tsConfig, (err) => {
        if (err?.code !== 'ENOENT') {
            return;
        }
        fs.createReadStream(path.join(cliDir, '../resources', 'tsconfig.json'))
            .pipe(fs.createWriteStream(tsConfig));
    });

}
