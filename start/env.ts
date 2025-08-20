/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  // ✅ OPTIMASI: Performance monitoring environment variables dengan default values
  DB_DEBUG: Env.schema.boolean.optional(),
  ENABLE_QUERY_MONITORING: Env.schema.boolean.optional(),
  SLOW_QUERY_THRESHOLD: Env.schema.number.optional(),
  SLOW_ENDPOINT_THRESHOLD: Env.schema.number.optional(),
  DB_POOL_MIN: Env.schema.number.optional(),
  DB_POOL_MAX: Env.schema.number.optional(),
  DB_QUERY_TIMEOUT: Env.schema.number.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring AWS S3 storage
  |----------------------------------------------------------
  */
AWS_ACCESS_KEY_ID: Env.schema.string.optional(),
AWS_SECRET_ACCESS_KEY: Env.schema.string.optional(),
AWS_REGION: Env.schema.string.optional(),
AWS_S3_BUCKET_NAME: Env.schema.string.optional(),
AWS_S3_ENDPOINT: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring storage configuration
  |----------------------------------------------------------
  */
  STORAGE_DRIVER: Env.schema.enum(['local', 's3'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.string.optional(),
  SMTP_USERNAME: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional()
})
