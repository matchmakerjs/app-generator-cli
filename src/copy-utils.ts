import * as fs from "fs";
import * as path from "path";
import * as shell from "shelljs";

export async function copy(source: string, dest: string): Promise<void> {
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
