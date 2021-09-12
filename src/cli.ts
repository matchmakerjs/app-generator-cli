#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { addJest } from './add-jest';
import { addTsLint } from './add-lint';
import { addTypescript } from './add-typescript';

const cwd = process.cwd();

yargs(hideBin(process.argv))
    .command(
        ['add [module...]'],
        'Add TS support to application',
        (yargs) => yargs,
        async (argv) => {
            for (const module of (argv.module as string[])) {
                switch (module) {
                    case 'ts':
                        await addTypescript({ cwd, argv, cliDir: __dirname });
                        break;
                    case 'tslint':
                        await addTsLint({ cwd, argv, cliDir: __dirname });
                        break;
                    case 'ts-jest':
                        await addJest({ cwd, argv, cliDir: __dirname });
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