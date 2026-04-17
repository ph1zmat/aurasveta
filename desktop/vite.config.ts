import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import fs from 'fs'

/**
 * React 19 dev-mode's logComponentRender calls tRPC's recursive Proxy
 * via apply traps with unexpected paths/args, crashing the app.
 *
 * Fix: patch createInnerProxy in @trpc/server to wrap `callback(opts)` in
 * try-catch inside the apply trap. This is the single entry point for all
 * unexpected proxy invocations and catches every crash scenario.
 */
function patchTrpcApplyTrap(): Plugin {
  return {
    name: 'patch-trpc-apply-trap',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('@trpc')) return null
      return applyPatch(code)
    },
  }
}

function esbuildPatchTrpcApplyTrap() {
  return {
    name: 'esbuild-patch-trpc-apply-trap',
    setup(build: any) {
      build.onLoad({ filter: /\.(mjs|js)$/ }, async (args: any) => {
        if (!args.path.includes('@trpc') && !args.path.includes('trpc')) return null
        let contents = await fs.promises.readFile(args.path, 'utf8')
        const result = applyPatch(contents)
        if (!result) return null
        return { contents: result.code, loader: 'js' }
      })
    },
  }
}

function applyPatch(code: string) {
  // Target: `return callback(opts);` inside the apply trap of createInnerProxy
  // in @trpc/server. Wrap in try-catch to absorb React dev-mode probing.
  if (!code.includes('return callback(opts);')) return null

  const patched = code.replace(
    'return callback(opts);',
    'try { return callback(opts); } catch { return undefined; }',
  )
  if (patched === code) return null
  return { code: patched, map: null }
}

export default defineConfig({
  base: './',
  optimizeDeps: {
    force: true,
    esbuildOptions: {
      plugins: [esbuildPatchTrpcApplyTrap()],
    },
  },
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: process.env.DESKTOP_API_PROXY_TARGET ?? 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    patchTrpcApplyTrap(),
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart({ reload }) {
          reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
