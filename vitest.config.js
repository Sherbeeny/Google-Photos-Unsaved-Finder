import { defineConfig } from 'vitest/config'
import string from 'vite-plugin-string'

export default defineConfig({
  plugins: [
    string({
      include: ['**/*.html', '**/*.css'],
    })
  ],
  test: {
    environment: 'jsdom',
  },
})
