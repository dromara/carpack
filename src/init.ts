import { exec } from 'node:child_process'
import { CarpackConfig, defineConfig } from './config'
import fs from 'node:fs'

export function init(path: string) {
  exec('git clone https://github.com/dromara/starter-carpack.git ' + path ?? '', (error, stdout, stderr) => {
    if (error)
      throw error
    console.log(stdout)
    console.log(stderr)
  })
}