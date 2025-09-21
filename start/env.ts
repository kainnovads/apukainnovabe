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
  DB_CONNECTION: Env.schema.string(),
  DB_SSL: Env.schema.boolean(),
  DB_DEBUG: Env.schema.boolean(),
  DB_POOL_MIN: Env.schema.number(),
  DB_POOL_MAX: Env.schema.number(),

  /*
  |----------------------------------------------------------
  | Variables for configuring storage configuration
  |----------------------------------------------------------
  */
  STORAGE_DRIVER: Env.schema.enum(['local', 's3']),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory']),

  /*
  |----------------------------------------------------------
  | Variables for configuring AWS S3 storage
  |----------------------------------------------------------
  */
  AWS_ACCESS_KEY_ID: Env.schema.string(),
  AWS_SECRET_ACCESS_KEY: Env.schema.string(),
  AWS_REGION: Env.schema.string(),
  AWS_S3_BUCKET_NAME: Env.schema.string(),
  AWS_S3_ENDPOINT: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  SMTP_HOST: Env.schema.string(),
  SMTP_PORT: Env.schema.number(),
  SMTP_USERNAME: Env.schema.string(),
  SMTP_PASSWORD: Env.schema.string(),
  SMTP_SECURE: Env.schema.boolean(),
  SMTP_TLS_REJECT_UNAUTHORIZED: Env.schema.boolean(),
  MAIL_FROM_ADDRESS: Env.schema.string(),
  SMTP_FROM_NAME: Env.schema.string(),
  MAILGUN_API_KEY: Env.schema.string.optional(),
  MAILGUN_DOMAIN: Env.schema.string.optional(),
  SPARKPOST_API_KEY: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring other things (CORS, Redis)
  |----------------------------------------------------------
  */
  REDIS_HOST: Env.schema.string(),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.string.optional(),
  REDIS_DB: Env.schema.number(),
  REDIS_SESSION_DB: Env.schema.number(),
  REDIS_CACHE_DB: Env.schema.number(),
  REDIS_KEY_PREFIX: Env.schema.string(),
  CORS_ENABLED: Env.schema.boolean(),
});