import env from '#start/env';
import { defineConfig } from '@adonisjs/lucid';
const dbConfig = defineConfig({
    connection: 'postgres',
    connections: {
        postgres: {
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
                min: env.get('DB_POOL_MIN', 5),
                max: env.get('DB_POOL_MAX', 50),
                acquireTimeoutMillis: 10000,
                createTimeoutMillis: 10000,
                idleTimeoutMillis: 300000,
                reapIntervalMillis: 1000,
                createRetryIntervalMillis: 200,
                propagateCreateError: true,
            },
            debug: env.get('DB_DEBUG', false),
            asyncStackTraces: env.get('NODE_ENV') === 'development',
            migrations: {
                naturalSort: true,
                paths: ['database/migrations'],
                tableName: 'adonis_schema',
            },
            seeders: {
                paths: ['database/seeders'],
            },
        },
    },
});
export default dbConfig;
//# sourceMappingURL=database.js.map