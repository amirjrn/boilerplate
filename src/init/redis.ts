import { Redis } from 'ioredis';

// =============================================================================
// LOCAL REDIS - For Prisma Query Caching
// =============================================================================
// Connects to local Redis container on each droplet.
// Ultra-fast (~1ms), but NOT shared across regions.
// Used for: Query caching (findUnique, findFirst, findMany, etc.)
// =============================================================================

export const redisCache = new Redis({
  host: process.env.REDIS_CACHE_HOST || process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_CACHE_PORT || process.env.REDIS_PORT) || 6379,
  password:
    process.env.REDIS_CACHE_PASSWORD || process.env.REDIS_PASSWORD || undefined,
});

// =============================================================================
// MANAGED VALKEY - For OTP Storage
// =============================================================================
// Connects to DigitalOcean Managed Valkey in Frankfurt.
// Shared across all regions for cross-region consistency.
// Used for: OTP codes, session data (anything that needs consistency)
// =============================================================================

export const redisOtp = new Redis({
  host: process.env.REDIS_OTP_HOST || process.env.REDIS_HOST,
  port: Number(process.env.REDIS_OTP_PORT || process.env.REDIS_PORT) || 6379,
  password:
    process.env.REDIS_OTP_PASSWORD || process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_OTP_HOST ? {} : undefined, // Enable TLS for managed Valkey
});

// Legacy export for backward compatibility
// TODO: Update all imports to use redisCache or redisOtp explicitly
export const redis = redisCache;
