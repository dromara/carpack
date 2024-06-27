import { CarpackConfig } from "./config"
import path, { join, resolve } from "node:path"
import fs from 'node:fs/promises'
import fsa from 'node:fs'
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

function copyDirectory(source: string, destination: string) {
  if (!fsa.existsSync(destination)) {
    fsa.mkdirSync(destination, { recursive: true });
  }

  const items = fsa.readdirSync(source);

  items.forEach(item => {
    const sourcePath = path.join(source, item);
    const destinationPath = path.join(destination, item);

    if (fsa.lstatSync(sourcePath).isDirectory() && sourcePath !== '.newcar') {
      copyDirectory(sourcePath, destinationPath);
    } else {
      fsa.copyFileSync(sourcePath, destinationPath);
    }
  });
}


export async function build(config: CarpackConfig = {}, dev?: boolean) {
  config.windowConfig ??= {}

  const newCarDir = '.newcar';
  const packageJson = {
    name: 'temp',
    type: 'module',
    devDependencies: {
      'vite': 'latest',
      '@tauri-apps/cli': 'latest',
      '@types/node': 'latest'
    },
    dependencies: {
      'newcar': 'latest',
      'canvaskit-wasm': '0.39.1',
    },
    scripts: {
      'vite:build': 'vite build',
      'tauri:build': 'tauri build',
      'tauri:init': 'tauri init --ci --dev-path ..',
      'tauri:dev': 'tauri dev',
    }
  };

  const tauri = {
    "$schema": "../node_modules/@tauri-apps/cli/schema.json",
    "build": {
      "devPath": "./dist",
      "distDir": "./dist"
    },
    "package": {
      "productName": "${config.name}",
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
          // @ts-ignore
          "depends": []
        },
        // @ts-ignore
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
          // @ts-ignore
          "entitlements": null,
          "exceptionDomain": "",
          // @ts-ignore
          "frameworks": [],
          // @ts-ignore
          "providerShortName": null,
          // @ts-ignore
          "signingIdentity": null
        },
        // @ts-ignore
        "resources": [],
        "shortDescription": "",
        "targets": "all",
        "windows": {
          // @ts-ignore
          "certificateThumbprint": null,
          "digestAlgorithm": "sha256",
          "timestampUrl": ""
        }
      },
      "security": {
        // @ts-ignore
        "csp": null
      },
      "updater": {
        "active": false
      },
      "windows": [
        {
          "fullscreen": config.windowConfig.fullscreen ?? false,
          "height": config.windowConfig.winHeight ?? 600,
          "resizable": config.windowConfig.resizable ?? true,
          "title": config.windowConfig.title ?? 'Newcar App',
          "width": config.windowConfig.winWidth ?? 800
        }
      ]
    }
  }

  const viteConfig = `
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  rollupOptions: {
    output: {
      chunkFileNames: './[name]-[hash].js',
      entryFileNames: './[name]-[hash].js',
      assetFileNames: './[name]-[hash][extname]'
    }
  }
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
  <script type="module" src="${`./js/${config.main}` ?? './js/main.ts'}"></script>
</body>
</html>
`

  try {
    if (fsa.existsSync('.newcar'))
      await fs.rmdir(newCarDir, { recursive: true })
    await fs.mkdir(newCarDir, { recursive: true });
    copyDirectory(resolve('./src'), resolve('./.newcar/js'))
    await fs.writeFile(resolve(newCarDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    await fs.writeFile(resolve(newCarDir, 'vite.config.ts'), viteConfig);
    await fs.writeFile(resolve(newCarDir, 'index.html'), htmlConfig);
    await execAsync('npm run tauri:init', { cwd: newCarDir });
    console.log('Preparing finished.')
    await moveFiles('./.newcar/src-tauri', './.newcar')
    await fs.writeFile(resolve(newCarDir, 'tauri.conf.json'), JSON.stringify(tauri));
    await execAsync('npm install', { cwd: newCarDir });
    console.log('Installing dependencies finished.')
    await execAsync('npm run vite:build', { cwd: newCarDir })
    moveFiles('./.newcar/node_modules', './.newcar/dist/node_modules')
    console.log('Build finished.')
    await execAsync(dev ? 'npm run tauri:build' : 'npm run tauri:dev & npm run vite:build', { cwd: newCarDir })
  } catch (error) {
    console.error('Error during build process:', error);
  }
}
