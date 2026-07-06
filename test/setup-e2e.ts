import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.test first (contains DATABASE_URL for test database)
config({ path: path.resolve(process.cwd(), '.env.test') });

// Load .env for any missing variables (will not overwrite existing)
config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || 'ls2025',
});

beforeAll(async () => {
  // Ensure we can connect
  await prisma.$connect();
});

afterAll(async () => {
  // Wrap cleanup in try-catch to handle race conditions with test file hooks
  try {
    // Only quit Redis if connection is still open
    if (redis.status === 'ready' || redis.status === 'connecting') {
      await redis.quit();
    }
  } catch {
    // Connection already closed, ignore
  }

  try {
    await prisma.$disconnect();
  } catch {
    // Already disconnected, ignore
  }

  try {
    await pool.end();
  } catch {
    // Already closed, ignore
  }
});

// Clean DB and Redis before each test suite to ensure isolation
beforeEach(async () => {
  // Only clean Redis if connection is ready
  if (redis.status === 'ready') {
    await redis.flushall();
  }

  // Clean Postgres (Order matters due to foreign keys)
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  if (tables.length > 0) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  }
});
