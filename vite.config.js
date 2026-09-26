import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function imageKitAuthDevMiddleware(mode) {
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['SUPABASE_URL', 'VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'IMAGEKIT_PRIVATE_KEY', 'IMAGEKIT_PUBLIC_KEY', 'VITE_IMAGEKIT_PUBLIC_KEY']) {
    if (!process.env[key] && env[key]) process.env[key] = env[key]
  }

  return {
    name: 'imagekit-auth-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/imagekit-auth', async (req, res) => {
        const { default: handler } = await import('./api/imagekit-auth.js')
        return handler(req, res)
      })
      server.middlewares.use('/api/img', async (req, res) => {
        const { default: handler } = await import('./api/img.js')
        const url = new URL(req.url, 'http://localhost')
        req.query = Object.fromEntries(url.searchParams.entries())
        return handler(req, res)
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), imageKitAuthDevMiddleware(mode)],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-icons')) return 'icons'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor'
          if (id.includes('node_modules/@supabase')) return 'supabase'
        },
      },
    },
  },
}))
