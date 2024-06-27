#!/usr/bin/env node

import { Clerc } from "clerc";
import { init } from "./init.ts";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import fs from 'node:fs'
import { CarpackConfig } from "./config";
import { build } from "./build.ts";

const config = fs.existsSync(pathToFileURL(resolve('./carpack.config.js'))) ? await import(`${pathToFileURL(resolve('./carpack.config.js'))}`) : {}

const cli = Clerc.create()
  .scriptName('carpack')
  .description('📦 The packer of Newcar to package animation into Windows, MacOS, Linux, Android, IOS with Tarui.')
  .version('1.0.0')
  .command('init', 'Initialize a Newcar Project.', {
    parameters: [
      '[name]'
    ]
  })
  .command('build', 'Build a Newcar Project.')
  .command('dev', 'Watch file changed.')
  .on('init', (context) => {
    init(context.parameters.name)
  })
  .on('build', (context) => {
    build(config.default, false)
  })
  .on('dev', (context) => {
    build(config.default, true)
  })
  .parse()

export { defineConfig } from './config'