import { Module } from '@nestjs/common';
import { PrismaService } from './init/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SampleController } from './controller/sample.controller';
import { SampleService } from './service/sample.service';
import { SampleRepository } from './data-access/sample.repository';
import {
  authConfig,
  sendGridConfig,
  emailConfig,
  cacheConfig,
  databaseConfig,
  redisConfig,
} from './init/config';
import { RedisModule } from './init/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        authConfig,
        sendGridConfig,
        emailConfig,
        cacheConfig,
        databaseConfig,
        redisConfig,
      ],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    RedisModule,
  ],
  controllers: [SampleController],
  providers: [PrismaService, SampleService, SampleRepository],
})
export class AppModule {}
