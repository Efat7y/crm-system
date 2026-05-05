export default defineNuxtConfig({
  devtools: { enabled: false },
  experimental: {
    appManifest: false
  },
  css: ["~/assets/css/main.css"],
  postcss: {
    plugins: {
      "@tailwindcss/postcss": {},
      autoprefixer: {}
    }
  },
  router: {
    middleware: ["auth-init"]
  },
  vite: {
    server: {
      warmup: {
        clientFiles: [],
        ssrFiles: []
      }
    },
    optimizeDeps: {
      noDiscovery: true,
      exclude: ["nuxt"]
    }
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:5000/api"
    }
  },
  compatibilityDate: "2025-01-01"
})
