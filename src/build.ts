import { CarpackConfig } from "./config"
import { join, resolve } from "node:path"
import fs from 'node:fs/promises'
import { exec } from "node:child_process"
import { promisify } from 'util'

const execAsync = promisify(exec);

async function moveFiles(sourceDir: string, targetDir: string) {
  try {
      // 确保目标目录存在，如果不存在则创建它
      await fs.mkdir(targetDir, { recursive: true });

      // 获取源目录中的文件列表
      const files = await fs.readdir(sourceDir);

      // 遍历文件列表，对每个文件执行移动操作
      for (const file of files) {
          const sourceFilePath = join(sourceDir, file);
          const targetFilePath = join(targetDir, file);

          await fs.rename(sourceFilePath, targetFilePath);
      }

      console.log('Files moved successfully.');
  } catch (error) {
      console.error('Error moving files:', error);
  }
}


export async function build(config: CarpackConfig = {}) {
  config.windowConfig ??= {}

  const newCarDir = '.newcar';
  const packageJson = {
    name: 'temp',
    type: 'module',
    devDependencies: {
      'vite': 'latest',
      '@tauri-apps/cli': 'latest'
    },
    scripts: {
      'vite:build': 'vite build',
      'tauri:build': 'tauri build',
      'tauri:init': 'tauri init --ci --dev-path ..',
      'tauri:dev': 'tauri dev',
    }
  };

  const tauri = `
{
  "$schema": "../node_modules/@tauri-apps/cli/schema.json",
  "build": {
    "devPath": ".",
    "distDir": "./dist"
  },
  "package": {
    "productName": "temp",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false
    },
    "bundle": {
      "active": true,
      "category": "DeveloperTool",
      "copyright": "",
      "deb": {
        "depends": []
      },
      "externalBin": [],
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "identifier": "org.tauri.dev",
      "longDescription": "",
      "macOS": {
        "entitlements": null,
        "exceptionDomain": "",
        "frameworks": [],
        "providerShortName": null,
        "signingIdentity": null
      },
      "resources": [],
      "shortDescription": "",
      "targets": "all",
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      }
    },
    "security": {
      "csp": null
    },
    "updater": {
      "active": false
    },
    "windows": [
      {
        "fullscreen": false,
        "height": ${config.windowConfig.winHeight ?? 600},
        "resizable": true,
        "title": "${config.windowConfig.title ?? 'Newcar App'}",
        "width": ${config.windowConfig.winWidth ?? 800}
      }
    ]
  }
}

  `

  const viteConfig = `
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
})
`;

  const htmlConfig = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <canvas id="${config.canvasID ?? 'canvas'}" width="${config.width ?? 800}" height="${config.height ?? 600}" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: black"></canvas>
  <script type="module" src="./main.ts"></script>
</body>
</html>
`

  try {
    await fs.mkdir(newCarDir, { recursive: true });
    await fs.writeFile(resolve(newCarDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    await fs.writeFile(resolve(newCarDir, 'vite.config.ts'), viteConfig);
    await fs.writeFile(resolve(newCarDir, 'index.html'), htmlConfig);
    await fs.copyFile(resolve('src/main.ts'), resolve('.newcar/main.ts'))
    const { stdout: out0, stderr: err0 } = await execAsync('npm run tauri:init', { cwd: newCarDir });
    console.log(out0);
    console.error(err0);
    await moveFiles('./.newcar/src-tauri', './.newcar')
    await fs.writeFile(resolve(newCarDir, 'tauri.conf.json'), tauri);
    const { stdout: out1, stderr: err1 } = await execAsync('npm install', { cwd: newCarDir });
    console.log(out1);
    console.error(err1);
    const { stdout: out2, stderr: err2 } = await execAsync('npm run vite:build', { cwd: newCarDir })
    console.log(out2);
    console.error(err2);
    const { stdout: out3, stderr: err3 } = await execAsync('npm run tauri:build', { cwd: newCarDir })
    console.log(out3);
    console.error(err3);
  } catch (error) {
    console.error('Error during build process:', error);
  }
}
