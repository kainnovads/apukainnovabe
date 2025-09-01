import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const isGCP = env.get('NODE_ENV') === 'production'

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: isGCP
        ? {
            host: `/cloudsql/${env.get('cloud_sql_instances')}`, // ✅ socket path GCP
            user: env.get('DB_USER'),
            password: env.get('DB_PASSWORD'),
            database: env.get('DB_DATABASE'),
          }
        : {
            host: env.get('DB_HOST', '127.0.0.1'),
            port: env.get('DB_PORT', 5432),
            user: env.get('DB_USER'),
            password: env.get('DB_PASSWORD'),
            database: env.get('DB_DATABASE'),
            ssl: env.get('DB_SSL', 'false') === 'true' ?
            { rejectUnauthorized: false }
              : false,
          },
      pool: {
        min: env.get('DB_POOL_MIN', 2),
        max: env.get('DB_POOL_MAX', 10),
      },
    },
  },
})

export default dbConfig
