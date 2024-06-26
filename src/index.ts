import { Clerc } from "clerc";
import { init } from "./init.ts";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import fs from 'node:fs'
import { CarpackConfig } from "./config";
import { build } from "./build.ts";

let config: CarpackConfig

if (fs.existsSync(pathToFileURL(resolve('./carpack.config.ts'))))
  config = (await import(`${pathToFileURL(resolve('./carpack.config.ts'))}`)).default
else
  console.error('It seems no config file in the current directory, use `carpack init` to initialize a Newcar project')

const cli = Clerc.create()
  .scriptName('carpack')
  .description('📦 The packer of Newcar to package animation into Windows, MacOS, Linux, Android, IOS with Tarui.')
  .version('1.0.0')
  .command('init', 'Initialize a Newcar Project.', {
    parameters: [
      '[name]'
    ]
  })
  .command('build', 'Build a Newcar Project.', {
    parameters: [
      '[dev]'
    ]
  })
  .on('init', (context) => {
    init(context.parameters.name)
  })
  .on('build', (context) => {
    build(config, context.parameters.dev ? true : false)
  })
  .parse()

export { defineConfig } from './config'