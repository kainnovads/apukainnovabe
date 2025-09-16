import { defineConfig } from '@adonisjs/lucid'
import env from '#start/env'

/**
 * Flag buat nentuin koneksi.
 * - true  → connect via socket (App Engine / GCP)
 * - false → connect via public IP (Local Dev / Manual Deploy)
 */
const isGCP = env.get('IS_GCP', 'false') === 'true'

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: isGCP
        ? {
            // ✅ Socket connection (GCP App Engine)
            host: `/cloudsql/${env.get('INSTANCE_CONNECTION_NAME')}`,
            user: env.get('DB_USER'),
            password: env.get('DB_PASSWORD'),
            database: env.get('DB_DATABASE'),
            port: 5432, // tetap aman define port
          }
        : {
            // ✅ Public IP (Local atau deploy non-socket)
            host: env.get('DB_HOST', '127.0.0.1'),
            port: env.get('DB_PORT', 5432),
            user: env.get('DB_USER'),
            password: env.get('DB_PASSWORD'),
            database: env.get('DB_DATABASE'),
            ssl:
              env.get('DB_SSL', 'false') === 'true'
                ? { rejectUnauthorized: false }
                : false,
          },
      pool: {
        min: env.get('DB_POOL_MIN', 2),
        max: env.get('DB_POOL_MAX', 10),
      },
      migrations: {
        naturalSort: true,
      },
    },
  },
})

export default dbConfig
