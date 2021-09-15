#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { addJest } from './add-jest';
import { addTsLint } from './add-lint';
import { addMatchmaker } from './add-matchmaker';
import { addTypescript } from './add-typescript';

const cwd = process.cwd();

yargs(hideBin(process.argv))
    .command(
        ['add [module...]'],
        'Add TS support to application',
        (yargs) => yargs,
        async (argv) => {
            const modules = argv.module as string[];
            for (const module of (modules)) {
                switch (module) {
                    case 'ts':
                        await addTypescript({
                            cwd,
                            argv,
                            cliDir: __dirname,
                            jestEnabled: modules.includes('ts-jest')
                        });
                        break;
                    case 'tslint':
                        await addTsLint({ cwd, argv, cliDir: __dirname });
                        break;
                    case 'ts-jest':
                        await addJest({ cwd, argv, cliDir: __dirname });
                        break;
                    case 'matchmaker':
                        await addMatchmaker({ cwd, argv, cliDir: __dirname });
                        break;
                }
            }
        }
    )
    .demandCommand(2)
    .option('workDir', {
        type: 'string',
        description: 'The project directory',
        default: cwd
    })
    .argv;