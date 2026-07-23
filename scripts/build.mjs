import * as esbuild from 'esbuild';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const watch = args.includes('--watch');
const modeIdx = args.indexOf('--mode');
const mode = modeIdx >= 0 ? args[modeIdx + 1] : 'none';
const production = mode === 'production';

const sharedOptions = {
  bundle: true,
  sourcemap: !production,
  minify: production,
  legalComments: 'none',
  logLevel: 'info',
  treeShaking: true
};

async function buildExtension() {
  const result = await esbuild.build({
    ...sharedOptions,
    entryPoints: ['src/extension.ts'],
    outfile: 'out/extension.js',
    platform: 'node',
    target: 'es2020',
    format: 'cjs',
    external: ['vscode'],
    mainFields: ['module', 'main'],
    tsconfig: 'tsconfig.json'
  });
  return result;
}

async function buildWebview() {
  const result = await esbuild.build({
    ...sharedOptions,
    entryPoints: ['src/webview/profileManagerMain.ts'],
    outfile: 'out/webview/profileManager.js',
    platform: 'browser',
    target: ['es2020', 'chrome100'],
    format: 'iife',
    mainFields: ['browser', 'module', 'main'],
    tsconfig: 'tsconfig.webview.json'
  });
  return result;
}

async function main() {
  try {
    if (watch) {
      const extCtx = await esbuild.context({
        ...sharedOptions,
        entryPoints: ['src/extension.ts'],
        outfile: 'out/extension.js',
        platform: 'node',
        target: 'es2020',
        format: 'cjs',
        external: ['vscode'],
        mainFields: ['module', 'main'],
        tsconfig: 'tsconfig.json'
      });
      const webviewCtx = await esbuild.context({
        ...sharedOptions,
        entryPoints: ['src/webview/profileManagerMain.ts'],
        outfile: 'out/webview/profileManager.js',
        platform: 'browser',
        target: ['es2020', 'chrome100'],
        format: 'iife',
        mainFields: ['browser', 'module', 'main'],
        tsconfig: 'tsconfig.webview.json'
      });
      await Promise.all([extCtx.watch(), webviewCtx.watch()]);
      console.log('Watching for changes...');
    } else {
      await Promise.all([buildExtension(), buildWebview()]);
    }
  } catch (ex) {
    console.error(ex);
    process.exit(1);
  }
}

main();
