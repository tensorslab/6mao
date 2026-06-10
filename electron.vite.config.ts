import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:8000'

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'src/main/index.ts')
          }
        }
      }
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'src/preload/index.ts')
          }
        }
      }
    },
    renderer: {
      plugins: [react(), tailwindcss()],
      server: {
        port: 5173,
        strictPort: true,
        proxy: {
          '/api': {
            target: apiProxyTarget,
            changeOrigin: true
          },
          '/health': {
            target: apiProxyTarget,
            changeOrigin: true
          }
        }
      },
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'src/renderer/index.html'),
            pet: resolve(__dirname, 'src/renderer/pet-window/index.html'),
            chat: resolve(__dirname, 'src/renderer/chat-window/index.html')
          }
        }
      }
    }
  }
})
