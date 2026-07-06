// Note: Environment variables should be loaded before importing this module
// (e.g., via dotenv in main.ts or test setup files)
import { registerAs } from '@nestjs/config';
import {
  CACHE_NAMESPACE,
  CACHE_DEFAULT_TTL,
  CACHE_DEFAULT_STALE_TIME,
  CACHE_MEMORY_FALLBACK,
  CACHE_MEMORY_MAX_ITEMS,
  APPLE_KEY_ID,
  APPLE_CLIENT_ID,
  APPLE_TEAM_ID,
  GOOGLE_REDIRECT_URI,
  EMAIL_SENDER,
} from './constants';

const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.ACCESS_TOKEN_SECRET,
  appleP8: process.env.APPLE_P8,
  appleKeyId: process.env.APPLE_KEY_ID ?? APPLE_KEY_ID,
  appleClientId: process.env.APPLE_CLIENT_ID ?? APPLE_CLIENT_ID,
  appleTeamId: process.env.APPLE_TEAM_ID ?? APPLE_TEAM_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? GOOGLE_REDIRECT_URI,
}));

const sendGridConfig = registerAs('sendgrid', () => ({
  apiKey: process.env.SENDGRID_API_KEY,
}));

const emailConfig = registerAs('email', () => ({
  sender: process.env.EMAIL_SENDER || EMAIL_SENDER,
}));

const cacheConfig = registerAs('cache', () => ({
  namespace: process.env.CACHE_NAMESPACE ?? CACHE_NAMESPACE,
  defaultTtl: process.env.CACHE_DEFAULT_TTL
    ? parseInt(process.env.CACHE_DEFAULT_TTL, 10)
    : CACHE_DEFAULT_TTL,
  defaultStaleTime: process.env.CACHE_DEFAULT_STALE_TIME
    ? parseInt(process.env.CACHE_DEFAULT_STALE_TIME, 10)
    : CACHE_DEFAULT_STALE_TIME,
  memoryFallback: process.env.CACHE_MEMORY_FALLBACK
    ? process.env.CACHE_MEMORY_FALLBACK === 'true'
    : CACHE_MEMORY_FALLBACK,
  memoryMaxItems: process.env.CACHE_MEMORY_MAX_ITEMS
    ? parseInt(process.env.CACHE_MEMORY_MAX_ITEMS, 10)
    : CACHE_MEMORY_MAX_ITEMS,
}));

const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  password: process.env.REDIS_PASSWORD,
}));

export {
  authConfig,
  sendGridConfig,
  emailConfig,
  cacheConfig,
  databaseConfig,
  redisConfig,
};
