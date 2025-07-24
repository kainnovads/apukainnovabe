import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {

      // ✅ OPTIMASI: Database configuration yang kompatibel dengan tarn.js terbaru
      // AWS RDS
      // client: 'pg',
      // connection: {
      //   host: process.env.PG_HOST || 'awseb-e-vt5ag4hpbm-stack-awsebrdsdatabase-o9lpm8hazq2t.cqvyg0uik35c.us-east-1.rds.amazonaws.com',
      //   port: Number(process.env.PG_PORT) || 5432,
      //   user: process.env.PG_USER || 'superadmin',
      //   password: process.env.PG_PASSWORD || 'KainnovaDS#2139725',
      //   database: process.env.PG_DB_NAME || 'ebdb',
      //   ssl: {
      //     rejectUnauthorized: false
      //   }
      // },

      // Localhost
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
        ssl: env.get('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
      },
      pool: {
        // ✅ OPTIMASI: Pool configuration yang kompatibel dengan tarn.js terbaru
        min                      : env.get('DB_POOL_MIN', 5),    // Minimum connections
        max                      : env.get('DB_POOL_MAX', 50),   // Maximum connections
        acquireTimeoutMillis     : 10000, // Timeout untuk mendapat koneksi
        createTimeoutMillis      : 10000, // Timeout untuk membuat koneksi baru
        idleTimeoutMillis        : 300000, // 5 menit - timeout untuk koneksi idle
        reapIntervalMillis       : 1000,  // Interval untuk cleanup koneksi idle
        createRetryIntervalMillis: 200,   // Retry interval untuk koneksi gagal
        propagateCreateError     : true,  // Propagate error saat create connection
        // Catatan: Opsi advanced seperti evictionRunIntervalMillis, destroyTimeoutMillis,
        // numTestsPerEvictionRun, testOnBorrow, validateOnBorrow sudah tidak didukung
        // di tarn.js versi terbaru dan telah dihapus untuk menghindari error
      },
      // ✅ OPTIMASI: Query debugging dan performance monitoring dengan defaults
      debug: env.get('DB_DEBUG', false), // Default false jika tidak ada di .env
      asyncStackTraces: env.get('NODE_ENV') === 'development',

      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
        // ✅ OPTIMASI: Migration table customization
        tableName: 'adonis_schema',
      },

      // ✅ OPTIMASI: Seed configuration
      seeders: {
        paths: ['database/seeders'],
      },
    },
  },
})

export default dbConfig
