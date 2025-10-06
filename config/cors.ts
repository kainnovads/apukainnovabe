import { defineConfig } from '@adonisjs/cors'

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  enabled: true,

  origin: [
    'http://apu.kainnovadigital.com', 
    'https://apu.kainnovadigital.com', 
    'https://erp.kainnovadigital.com',
    'https://nuxt-erp.vercel.app',
    'https://nuxt-erp-git-main-kainnovadigital.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
  ],

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
