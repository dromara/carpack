import { exec } from 'node:child_process'
import { CarpackConfig } from './config'

export function init(config: CarpackConfig) {
  exec('git clone https://github.com/dromara/starter-carpack.git .', (error, stdout, stderr) => {
    if (error)
      throw error
    console.log(stdout)
    console.log(stderr)
  })
}