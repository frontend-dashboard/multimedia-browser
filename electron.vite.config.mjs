import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: ''
        }
      }
    },
    optimizeDeps: {
      exclude: [
        'playwright',
        'chromium-bidi/lib/cjs/bidiMapper/BidiMapper',
        'chromium-bidi/lib/cjs/cdp/CdpConnection'
      ]
    },
    build: {
      rollupOptions: {
        external: [
          'playwright',
          'chromium-bidi/lib/cjs/bidiMapper/BidiMapper',
          'chromium-bidi/lib/cjs/cdp/CdpConnection'
        ]
      }
    }
  }
})
