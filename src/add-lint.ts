import * as fs from "fs";
import * as path from "path";
import * as shell from "shelljs";
import { Arguments } from "yargs";

export async function addTsLint(options: {
    cliDir: string,
    cwd: string,
    argv: Arguments
}): Promise<void> {

    const { argv, cliDir } = options;
    let cwd = (argv.workDir as string) || options.cwd;

    if (!path.isAbsolute(cwd)) {
        cwd = path.resolve(options.cwd, cwd);
    }

    shell.exec(`npm i --prefix ${cwd} eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-prettier eslint-config-prettier -D`);

    await new Promise<void>((res, rej) => {
        const packageJsonPath = path.resolve(cwd, 'package.json');
        fs.readFile(packageJsonPath, (err, data) => {
            if (err) return rej(err);
            const packageJson = JSON.parse(data.toString());
            if (!packageJson.scripts) {
                packageJson.scripts = {};
            }
            packageJson.scripts['lint'] = 'eslint . --ext .ts';
            packageJson.scripts['format'] = "prettier --write 'src/**/*.ts'";
            fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), (err) => {
                if (err) return rej(err);
                res();
            });
        });
    });

    for (const resouceName of ['.eslintrc.js', '.prettierrc.js', '.eslintignore']) {
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
