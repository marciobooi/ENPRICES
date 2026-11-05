import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { siteMeta } from './plugins/siteMeta.ts'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs: the tool is served from a fixed sub-path on the Eurostat host.
  base: './',
  plugins: [react(), siteMeta()],
  server: {
    // Lets GloBan render locally: map 127.0.0.1 to localhost.europa.eu in the hosts file.
    allowedHosts: ['localhost.europa.eu'],
  },
})
