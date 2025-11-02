import * as Joi from 'joi';

export const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),
  JWT_SECRET: Joi.string().required(),
  JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().default('30d'),
  JWT_REFRESH_TOKEN_EXPIRATION_TIME_MS: Joi.number().default(2592000000), // 30 days in ms
  OPENAI_API_KEY: Joi.string().required(),
  // USDA_API_KEY is optional (legacy) - FDC_API_KEY is preferred
  USDA_API_KEY: Joi.string().optional().allow(''),
  FDC_API_BASE: Joi.string().optional().default('https://api.nal.usda.gov/fdc'),
  FDC_API_KEY: Joi.string().optional().allow(''),
  FDC_CACHE_TTL_SECONDS: Joi.number().optional().default(86400),
  NUTRITION_PROVIDER: Joi.string().valid('hybrid', 'openai', 'usda').default('hybrid'),
  NUTRITION_FEATURE_FALLBACK: Joi.boolean().default(true),
  EMAIL_SERVICE_HOST: Joi.string().optional().allow(''),
  EMAIL_SERVICE_PORT: Joi.number().optional().default(587),
  EMAIL_SERVICE_USER: Joi.string().optional().allow(''),
  EMAIL_SERVICE_PASSWORD: Joi.string().optional().allow(''),
  EMAIL_FROM: Joi.string().optional().default('no-reply@caloriecam.com'),
  API_BASE_URL: Joi.string().required(),
});