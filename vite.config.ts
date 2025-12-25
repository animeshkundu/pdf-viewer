import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// Determine base path based on branch name for GitHub Pages deployment
// For GitHub Pages project repos (github.io/repo-name), we need '/repo-name/' base path
// Use '/pdf-viewer/' for main/master branches on GitHub Pages
// Use '/pdf-viewer/test-{branch-name}/' for other branches
// Use '/' for local development (when GITHUB_REF_NAME is not set)
const getBasePath = () => {
  // If GITHUB_REF_NAME is not set, we're in local development - use '/'
  const branchName = process.env.GITHUB_REF_NAME
  if (!branchName) {
    return '/'
  }
  
  // On GitHub Actions, use proper paths
  if (branchName === 'main' || branchName === 'master') {
    return '/pdf-viewer/'
  }
  const safeBranch = branchName.replace(/[^a-zA-Z0-9-]/g, '-')
  return `/pdf-viewer/test-${safeBranch}/`
}

// https://vite.dev/config/
export default defineConfig({
  base: getBasePath(),
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
        scope: getBasePath(),
        start_url: getBasePath(),
        orientation: 'any',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-maskable-512x512.png',
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
});
