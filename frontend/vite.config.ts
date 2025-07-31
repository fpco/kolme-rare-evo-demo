import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 1337,
  },
  plugins: [
    tailwindcss(),
    react(),
    nodePolyfills({
      include: ['buffer', 'crypto'],
    }),
  ],
})
