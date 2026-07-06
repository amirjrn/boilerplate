import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { REDIS_CACHE_TOKEN } from './redis.module';
import objectHash from 'object-hash';
import { LRUCache } from 'lru-cache';
import superjson from 'superjson';
import { CACHE_MODEL_TTL, CACHE_MODEL_STALE_TIME } from './constants';

// =============================================================================
// TYPES
// =============================================================================

interface Transformer<T = unknown> {
  serialize: (data: T) => string;
  deserialize: (data: string) => T;
}

// Unused legacy types removed (PrismaMiddlewareParams, PrismaMiddlewareNext)

interface ModelCacheConfig {
  ttl: number; // Cache TTL in seconds
  staleTime?: number; // Stale-while-revalidate time in seconds
  invalidateRelated?: string[]; // Related models to invalidate on write
  excludeMethods?: string[]; // Methods to exclude from caching for this model
  cacheKey?: string; // Custom cache key prefix (default: model name)
  useVersioning?: boolean; // Use updatedAt for version-based validation
  tagGenerator?: (args: Record<string, unknown>, result: unknown) => string[]; // Generate cache tags from query args/result
}

interface GlobalCacheConfig {
  namespace: string; // Cache key namespace
  defaultTtl: number; // Default TTL for models without explicit TTL
  defaultStaleTime: number; // Default stale time
  excludeMethods: string[]; // Methods to exclude globally
  memoryFallback: boolean; // Use memory cache as fallback if Redis fails
  memoryMaxItems: number; // Max items in memory fallback cache
  transformer: Transformer<CacheEntry>; // Serializer/deserializer
}

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Creates global cache configuration from environment values.
 * @param options Configuration options from environment
 * @returns GlobalCacheConfig object
 */
function createGlobalConfig(options: {
  namespace?: string;
  defaultTtl?: number;
  defaultStaleTime?: number;
  memoryFallback?: boolean;
  memoryMaxItems?: number;
  excludeMethods?: string[];
}): GlobalCacheConfig {
  return {
    namespace: options.namespace ?? 'prisma',
    defaultTtl: options.defaultTtl ?? 60,
    defaultStaleTime: options.defaultStaleTime ?? 10,
    excludeMethods: options.excludeMethods ?? [],
    memoryFallback: options.memoryFallback ?? true,
    memoryMaxItems: options.memoryMaxItems ?? 1000,
    transformer: {
      // Default transformer using superjson
      serialize: (data: unknown): string => superjson.stringify(data),
      deserialize: (data: string): CacheEntry =>
        superjson.parse<CacheEntry>(data),
    },
  };
}

const MODEL_CONFIG: Record<string, ModelCacheConfig> = {
  User: {
    ttl: CACHE_MODEL_TTL.User,
    staleTime: CACHE_MODEL_STALE_TIME.User,
    useVersioning: true,
    // cacheKey: 'usr',           // Use 'usr' instead of 'User' in cache keys
    // invalidateRelated: ['Progress', 'Achievement'],
  },
  RefreshToken: {
    ttl: CACHE_MODEL_TTL.RefreshToken, // Don't cache tokens (security)
    useVersioning: true,
  },
  Lesson: {
    ttl: CACHE_MODEL_TTL.Lesson,
    staleTime: CACHE_MODEL_STALE_TIME.Lesson, // Content can be stale for 1 minute
    useVersioning: true,
  },
  Achievement: {
    ttl: CACHE_MODEL_TTL.Achievement,
    useVersioning: true,
  },
  Progress: {
    ttl: CACHE_MODEL_TTL.Progress,
    invalidateRelated: ['User'],
    useVersioning: true,
  },
  Language: {
    ttl: CACHE_MODEL_TTL.Language,
    useVersioning: true,
  },
};

// =============================================================================
// CACHE OPERATIONS
// =============================================================================

const CACHEABLE_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

const WRITE_OPERATIONS = new Set([
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
]);

// =============================================================================
// MEMORY FALLBACK CACHE (LRU)
// =============================================================================

// Memory cache is created lazily when needed, with config passed at runtime
let memoryCache: LRUCache<
  string,
  { data: unknown; expiresAt: number; staleUntil: number }
> | null = null;

function getMemoryCache(config: GlobalCacheConfig) {
  if (!memoryCache) {
    memoryCache = new LRUCache({
      max: config.memoryMaxItems,
      ttl: config.defaultTtl * 1000, // LRU uses milliseconds
    });
  }
  return memoryCache;
}

// =============================================================================
// CACHE UTILITIES
// =============================================================================

function getCacheKey(
  model: string,
  operation: string,
  args: Record<string, unknown> | undefined,
  namespace: string,
  customKey?: string,
): string {
  const modelKey = customKey || model;
  const argsHash = objectHash(args ?? {}, { algorithm: 'md5' });
  return `${namespace}:${modelKey}:${operation}:${argsHash}`;
}

function getModelPattern(
  model: string,
  namespace: string,
  customKey?: string,
): string {
  const modelKey = customKey || model;
  return `${namespace}:${modelKey}:*`;
}

// =============================================================================
// IN-FLIGHT REQUEST DEDUPLICATION
// =============================================================================

function getTagKey(tag: string, namespace: string): string {
  return `${namespace}:tags:${tag}`;
}

/**
 * Extract tags from result data (e.g., result.id -> 'model:id')
 */
function extractTagsFromResult(model: string, result: unknown): string[] {
  const tags: string[] = [];
  if (!result || typeof result !== 'object') return tags;
  const record = result as Record<string, unknown>;
  if (record.id && typeof record.id === 'string') {
    tags.push(`${model.toLowerCase()}:${record.id}`);
  }
  return tags;
}

/**
 * Extract tags from write operation args and result.
 * Handles: create (from result), update/delete (from where clause), createMany/updateMany/deleteMany (falls back to model-wide)
 */
function extractTagsFromWriteOperation(
  model: string,
  operation: string,
  args: Record<string, unknown> | undefined,
  result: unknown,
): string[] {
  const tags: string[] = [];
  const modelLower = model.toLowerCase();

  // For single-record operations, extract from result first (most reliable)
  if (['create', 'update', 'upsert', 'delete'].includes(operation)) {
    if (result && typeof result === 'object') {
      const record = result as Record<string, unknown>;
      if (record.id && typeof record.id === 'string') {
        tags.push(`${modelLower}:${record.id}`);
        return tags;
      }
    }
  }

  // Fallback: extract from where clause (for update/delete if result doesn't have id)
  if (args?.where && typeof args.where === 'object') {
    const where = args.where as Record<string, unknown>;
    if (where.id && typeof where.id === 'string') {
      tags.push(`${modelLower}:${where.id}`);
    }
  }

  return tags;
}

const inFlightRequests = new Map<string, Promise<unknown>>();

async function deduplicatedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  onDedupe?: (key: string) => void,
): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    onDedupe?.(key);
    return existing as Promise<T>;
  }

  const promise = queryFn().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}

// =============================================================================
// TAG REGISTRATION & INVALIDATION
// =============================================================================

/**
 * Register a cache key with its associated tags in Redis Sets.
 */
async function registerTags(
  cacheKey: string,
  tags: string[],
  redis: Redis,
  namespace: string,
  ttl: number,
): Promise<void> {
  if (tags.length === 0) return;
  try {
    const pipeline = redis.pipeline();
    for (const tag of tags) {
      const tagKey = getTagKey(tag, namespace);
      pipeline.sadd(tagKey, cacheKey);
      pipeline.expire(tagKey, ttl + 60);
    }
    await pipeline.exec();
  } catch (error) {
    callbacks.onError(error as Error, `redis:registerTags:${tags.join(',')}`);
  }
}

/**
 * Invalidate all cache keys associated with the given tags.
 */
async function invalidateByTagsInternal(
  tags: string[],
  redis: Redis,
  namespace: string,
  globalConfig: GlobalCacheConfig,
  onInvalidate?: (tag: string, count: number) => void,
): Promise<number> {
  let totalDeleted = 0;
  for (const tag of tags) {
    const tagKey = getTagKey(tag, namespace);
    try {
      const cacheKeys = await redis.smembers(tagKey);
      if (cacheKeys.length > 0) {
        await redis.del(...cacheKeys);
        await redis.del(tagKey);
        totalDeleted += cacheKeys.length;
        onInvalidate?.(tag, cacheKeys.length);
      }
    } catch (error) {
      callbacks.onError(error as Error, `redis:invalidateByTags:${tag}`);
    }
  }
  return totalDeleted;
}

/**
 * Public API: Invalidate cache entries by tags.
 * @param tags Array of tags to invalidate (e.g., ['user:123', 'dashboard'])
 * @param redis Redis client instance
 * @param namespace Cache namespace (default: 'prisma')
 * @returns Number of cache keys deleted
 */
export async function invalidateCacheByTags(
  tags: string[],
  redis: Redis,
  namespace: string = 'prisma',
): Promise<number> {
  const globalConfig = createGlobalConfig({ namespace });
  return invalidateByTagsInternal(
    tags,
    redis,
    namespace,
    globalConfig,
    callbacks.onTagInvalidate,
  );
}

// =============================================================================
// STALE-WHILE-REVALIDATE LOGIC
// =============================================================================

interface CacheEntry {
  data: unknown;
  expiresAt: number; // When the cache expires
  staleUntil: number; // When stale data should no longer be served
  version?: string; // updatedAt timestamp for version-based validation
}

async function getFromCache(
  key: string,
  transformer: Transformer<CacheEntry>,
  redis: Redis,
  globalConfig: GlobalCacheConfig,
): Promise<{ data: unknown; isStale: boolean } | null> {
  const now = Date.now();

  // Try Redis first
  try {
    const cached = await redis.get(key);
    if (cached) {
      const entry = transformer.deserialize(cached);

      if (now < entry.expiresAt) {
        // Fresh data
        return { data: entry.data, isStale: false };
      } else if (now < entry.staleUntil) {
        // Stale but servable
        return { data: entry.data, isStale: true };
      }
      // Expired beyond stale time
      return null;
    }
  } catch (error) {
    callbacks.onError(error as Error, `redis:get:${key}`);

    // Fallback to memory cache
    if (globalConfig.memoryFallback) {
      const memEntry = getMemoryCache(globalConfig).get(key);
      if (memEntry) {
        if (now < memEntry.expiresAt) {
          return { data: memEntry.data, isStale: false };
        } else if (now < memEntry.staleUntil) {
          return { data: memEntry.data, isStale: true };
        }
      }
    }
  }

  return null;
}

async function setInCache(
  key: string,
  data: unknown,
  ttl: number,
  staleTime: number,
  transformer: Transformer<CacheEntry>,
  redis: Redis,
  globalConfig: GlobalCacheConfig,
  useVersioning?: boolean,
  tags?: string[],
): Promise<void> {
  const now = Date.now();

  // Extract version from updatedAt if versioning is enabled
  let version: string | undefined;
  if (useVersioning && data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (record.updatedAt instanceof Date) {
      version = record.updatedAt.toISOString();
    } else if (typeof record.updatedAt === 'string') {
      version = record.updatedAt;
    }
  }

  const entry: CacheEntry = {
    data,
    expiresAt: now + ttl * 1000,
    staleUntil: now + (ttl + staleTime) * 1000,
    version, // Store the updatedAt as version for validation
  };

  // Store in Redis with TTL that includes stale time
  try {
    const serialized = transformer.serialize(entry);
    await redis.setex(key, ttl + staleTime, serialized);
    // Register tags for this cache key
    if (tags && tags.length > 0) {
      await registerTags(
        key,
        tags,
        redis,
        globalConfig.namespace,
        ttl + staleTime,
      );
    }
  } catch (error) {
    callbacks.onError(error as Error, `redis:set:${key}`);
  }

  // Also store in memory fallback
  if (globalConfig.memoryFallback) {
    getMemoryCache(globalConfig).set(key, entry);
  }
}

// =============================================================================
// CACHE INVALIDATION
// =============================================================================

async function invalidateModelCache(
  model: string,
  config: ModelCacheConfig | undefined,
  redis: Redis,
  globalConfig: GlobalCacheConfig,
  onInvalidate?: (model: string, count: number) => void,
): Promise<void> {
  const modelsToInvalidate = [model];

  if (config?.invalidateRelated) {
    modelsToInvalidate.push(...config.invalidateRelated);
  }

  for (const m of modelsToInvalidate) {
    const modelConfig = MODEL_CONFIG[m];
    const pattern = getModelPattern(
      m,
      globalConfig.namespace,
      modelConfig?.cacheKey,
    );

    // Invalidate Redis using SCAN to avoid blocking
    try {
      let cursor = '0';
      let deletedCount = 0;
      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          await redis.del(...keys);
          deletedCount += keys.length;
        }
      } while (cursor !== '0');

      if (deletedCount > 0) {
        onInvalidate?.(m, deletedCount);
      }
    } catch (error) {
      callbacks.onError(error as Error, `redis:invalidate:${m}`);
    }

    // Invalidate memory cache
    if (globalConfig.memoryFallback) {
      const cache = getMemoryCache(globalConfig);
      let deleted = 0;
      for (const key of cache.keys()) {
        if (
          key.startsWith(
            `${globalConfig.namespace}:${modelConfig?.cacheKey || m}:`,
          )
        ) {
          cache.delete(key);
          deleted++;
        }
      }
      if (deleted > 0) {
        callbacks.onMemoryInvalidate(m, deleted);
      }
    }
  }
}

// =============================================================================
// CALLBACKS
// =============================================================================

export const cacheCallbacks = {
  onHit: (key: string, isStale: boolean) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache ${isStale ? 'STALE' : 'HIT'}] ${key}`);
    }
  },
  onMiss: (key: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache MISS] ${key}`);
    }
  },
  onDedupe: (key: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache DEDUPE] ${key}`);
    }
  },
  onInvalidate: (model: string, count: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache INVALIDATE] ${model} - ${count} Redis keys`);
    }
  },
  onMemoryInvalidate: (model: string, count: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache INVALIDATE] ${model} - ${count} memory keys`);
    }
  },
  onRevalidate: (key: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache REVALIDATE] ${key} - refreshing in background`);
    }
  },
  onTagInvalidate: (tag: string, count: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache TAG INVALIDATE] ${tag} - ${count} keys`);
    }
  },
  onError: (error: Error, context: string) => {
    console.error(`[Cache ERROR] ${context}:`, error.message);
  },
};

// Internal reference for use within this file
const callbacks = cacheCallbacks;

// =============================================================================
// SMART CACHE MIDDLEWARE
// =============================================================================

// =============================================================================
// PRISMA EXTENSION (Smart Cache) - Factory that accepts Redis
// =============================================================================

function createSmartCacheExtension(
  redis: Redis,
  globalConfig: GlobalCacheConfig,
) {
  return Prisma.defineExtension((client) => {
    return client.$extends({
      name: 'smart-cache',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
            // Note: Using 'query as any' is required because Prisma's extension types
            // don't properly type the query function for $allOperations dynamic hooks.
            // With extensions, 'client' usually refers to the transaction client if in transaction.
            // However, identifying if we are in a transaction explicitly is harder in extensions
            // without context. But generally, if it's a TX, we might want to skip caching.
            // For now, let's assume we cache unless explicitly told not to via custom args (not supported easily)
            // OR: In extensions, we just check if it's a write or read.

            // Note: 'runInTransaction' param from middleware is NOT available here directly.
            // We will rely on operation types.

            if (!model) {
              return (query as any)(args);
            }

            const config: ModelCacheConfig | undefined = MODEL_CONFIG[model];
            const ttl = config?.ttl ?? globalConfig.defaultTtl;
            const staleTime =
              config?.staleTime ?? globalConfig.defaultStaleTime;
            const action = operation; // Rename for consistency

            // Check global method exclusions
            if (globalConfig.excludeMethods.includes(action)) {
              return (query as any)(args);
            }

            // Handle WRITE operations
            if (WRITE_OPERATIONS.has(action)) {
              const result = await (query as any)(args);

              if (config) {
                // Extract tags from the write operation
                const tags = extractTagsFromWriteOperation(
                  model,
                  action,
                  args,
                  result,
                );

                if (tags.length > 0) {
                  // Use precise tag-based invalidation (e.g., only user:123)
                  invalidateByTagsInternal(
                    tags,
                    redis,
                    globalConfig.namespace,
                    globalConfig,
                    callbacks.onTagInvalidate,
                  ).catch((err) =>
                    callbacks.onError(
                      err as Error,
                      `invalidateByTags:${model}`,
                    ),
                  );
                } else {
                  // Fallback to model-wide invalidation for *Many operations
                  invalidateModelCache(
                    model,
                    config,
                    redis,
                    globalConfig,
                    callbacks.onInvalidate,
                  ).catch((err) =>
                    callbacks.onError(err as Error, `invalidate:${model}`),
                  );
                }
              }

              return result;
            }

            // Skip caching if model not configured or method excluded
            if (!config || config.excludeMethods?.includes(action)) {
              return (query as any)(args);
            }

            // Handle READ operations with stale-while-revalidate
            if (CACHEABLE_OPERATIONS.has(action) && ttl > 0) {
              const cacheKey = getCacheKey(
                model,
                action,
                args,
                globalConfig.namespace,
                config.cacheKey,
              );

              // Check cache
              const cached = await getFromCache(
                cacheKey,
                globalConfig.transformer,
                redis,
                globalConfig,
              );

              if (cached) {
                callbacks.onHit(cacheKey, cached.isStale);

                if (cached.isStale) {
                  // Stale-while-revalidate: return stale data, refresh in background
                  callbacks.onRevalidate(cacheKey);

                  // Background refresh (don't await)
                  deduplicatedQuery(`revalidate:${cacheKey}`, async () => {
                    const fresh = await (query as any)(args);
                    // Generate tags from result
                    let tags = extractTagsFromResult(model, fresh);
                    if (config.tagGenerator) {
                      tags = [...tags, ...config.tagGenerator(args, fresh)];
                    }
                    await setInCache(
                      cacheKey,
                      fresh,
                      ttl,
                      staleTime,
                      globalConfig.transformer,
                      redis,
                      globalConfig,
                      config.useVersioning,
                      tags,
                    );
                    return fresh;
                  }).catch((err: unknown) =>
                    callbacks.onError(
                      err instanceof Error ? err : new Error(String(err)),
                      `revalidate:${cacheKey}`,
                    ),
                  );
                }

                return cached.data;
              }

              callbacks.onMiss(cacheKey);

              // Execute with deduplication
              const result = await deduplicatedQuery<unknown>(
                cacheKey,
                () => (query as any)(args),
                callbacks.onDedupe,
              );

              // Store in cache
              if (result !== null && result !== undefined) {
                // Generate tags from result
                let tags = extractTagsFromResult(model, result);
                if (config.tagGenerator) {
                  tags = [...tags, ...config.tagGenerator(args, result)];
                }
                await setInCache(
                  cacheKey,
                  result,
                  ttl,
                  staleTime,
                  globalConfig.transformer,
                  redis,
                  globalConfig,
                  config.useVersioning,
                  tags,
                );
              }

              return result;
            }

            return (query as any)(args);
            /* eslint-enable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
          },
        },
      },
    });
  });
}

// =============================================================================
// PRISMA SERVICE
// =============================================================================

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private redis: Redis;

  constructor(
    private configService: ConfigService,
    @Inject(REDIS_CACHE_TOKEN) redis: Redis,
  ) {
    const connectionString = configService.get<string>('database.url');
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });

    this.redis = redis;

    // Create global config from the cache config namespace
    const globalConfig = createGlobalConfig({
      namespace: configService.get<string>('cache.namespace'),
      defaultTtl: configService.get<number>('cache.defaultTtl'),
      defaultStaleTime: configService.get<number>('cache.defaultStaleTime'),
      memoryFallback: configService.get<boolean>('cache.memoryFallback'),
      memoryMaxItems: configService.get<number>('cache.memoryMaxItems'),
      excludeMethods: configService.get<string[]>('cache.excludeMethods'),
    });

    // Apply the extension with injected Redis and config, return the EXTENDED client
    // This overrides the 'this' instance in the calling context if instantiated manually,
    // but in NestJS DI, it's safer to return the proxy.
    return this.$extends(
      createSmartCacheExtension(redis, globalConfig),
    ) as unknown as PrismaService;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    // Redis connections are closed by RedisModule.onModuleDestroy
  }
}
