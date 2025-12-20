import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/setupTests.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e', 'coverage', 'playwright-report'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/__tests__/**',
        'dist/',
        '.github/',
        'public/',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/components/ui/**', // shadcn components
      ],
      // Coverage thresholds - adjusted for current state
      // TODO: Increase these thresholds as test coverage improves
      thresholds: {
        branches: 35,
        functions: 60,
        lines: 40,
        statements: 40,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
