import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// Determine base path based on branch name for GitHub Pages deployment
// For project repos: /pdf-viewer/ for main, /pdf-viewer/test-{branch}/ for others
// Development uses '/' for simplicity
const getBasePath = () => {
  // In development, use root for simplicity
  if (process.env.NODE_ENV === 'development') {
    return '/'
  }
  
  const branchName = process.env.GITHUB_REF_NAME || process.env.BRANCH_NAME || 'main'
  const repoName = 'pdf-viewer' // GitHub Pages project repo base path
  
  if (branchName === 'main' || branchName === 'master') {
    return `/${repoName}/`
  }
  
  const safeBranch = branchName.replace(/[^a-zA-Z0-9-]/g, '-')
  return `/${repoName}/test-${safeBranch}/`
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const basePath = getBasePath()
  
  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon-192x192.png', 'icon-512x512.png', 'icon-maskable-512x512.png'],
        manifest: {
          name: 'PDF Viewer & Editor',
          short_name: 'PDF Editor',
          description: 'Professional client-side PDF viewing, annotation, and editing tool',
          theme_color: '#474747',
          background_color: '#f5f5f7',
          display: 'standalone',
          scope: basePath,
          start_url: basePath,
          orientation: 'any',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  }
}});
