import { Module, Global, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const REDIS_CACHE_TOKEN = 'REDIS_CACHE';
export const REDIS_OTP_TOKEN = 'REDIS_OTP';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CACHE_TOKEN,
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('redis.host') || 'localhost',
          port: configService.get<number>('redis.port') || 6379,
          password: configService.get<string>('redis.password'),
        });
      },
      inject: [ConfigService],
    },
    {
      provide: REDIS_OTP_TOKEN,
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('redis.host') || 'localhost';
        return new Redis({
          host,
          port: configService.get<number>('redis.port') || 6379,
          password: configService.get<string>('redis.password'),
          tls: host !== 'localhost' && host !== 'redis' ? {} : undefined,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CACHE_TOKEN, REDIS_OTP_TOKEN],
})
export class RedisModule implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_CACHE_TOKEN) private readonly redisCache: Redis,
    @Inject(REDIS_OTP_TOKEN) private readonly redisOtp: Redis,
  ) {}

  async onModuleDestroy() {
    // Gracefully close both Redis connections
    await Promise.all([
      this.redisCache.quit().catch(() => {}),
      this.redisOtp.quit().catch(() => {}),
    ]);
  }
}
