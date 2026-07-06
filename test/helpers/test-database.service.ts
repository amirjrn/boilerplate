import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Test-specific Prisma service that connects to a test database.
 * Uses DATABASE_URL environment variable to avoid affecting development/production data.
 */
@Injectable()
export class TestDatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString =
      process.env.DATABASE_URL || process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL or DATABASE_URL must be set for tests');
    }

    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Clean all data from the test database
   */
  async cleanDatabase() {
    // Delete in order to respect foreign key constraints
    await this.refreshToken.deleteMany({});
    await this.user.deleteMany({});
  }

  /**
   * Reset the database to a clean state
   */
  async resetDatabase() {
    await this.cleanDatabase();
  }
}
