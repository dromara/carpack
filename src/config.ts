export type Target = 'Windows'

export interface CarpackConfig {
  app?: string,
  target?: Target[],
  main?: string,
  canvasID?: string,
  width?: number,
  height?: number,
  name?: string,
  windowConfig?: {
    winWidth?: number,
    winHeight?: number,
    title?: string,
  }
}

export function defineConfig(config: CarpackConfig) {
  return config
}