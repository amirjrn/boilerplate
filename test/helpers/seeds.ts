import { TestDatabaseService } from './test-database.service';
import { Prisma } from '@prisma/client';

/**
 * Predefined test user data
 */
export const TEST_USERS = {
  emailUser: {
    id: 'test-user-email-001',
    email: 'test@example.com',
    name: 'Test Email User',
    avatar: 'https://example.com/avatar.png',
  },
  googleUser: {
    id: 'test-user-google-001',
    email: 'google@example.com',
    name: 'Test Google User',
    googleUserId: 'google-123456',
    avatar: 'https://example.com/google-avatar.png',
  },
  appleUser: {
    id: 'test-user-apple-001',
    email: 'apple@example.com',
    name: 'Test Apple User',
    appleUserId: 'apple-123456',
    avatar: 'https://example.com/apple-avatar.png',
  },
  userWithoutName: {
    id: 'test-user-no-name-001',
    email: 'noname@example.com',
    name: null,
    avatar: 'https://example.com/default-avatar.png',
  },
};

/**
 * Predefined test refresh token data
 */
export const TEST_REFRESH_TOKENS = {
  validToken: {
    id: 'test-token-001',
    token: 'valid-refresh-token-123456789',
    userId: TEST_USERS.emailUser.id,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days from now
  },
  expiredToken: {
    id: 'test-token-002',
    token: 'expired-refresh-token-123456789',
    userId: TEST_USERS.emailUser.id,
    expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  googleUserToken: {
    id: 'test-token-003',
    token: 'google-user-refresh-token-123456789',
    userId: TEST_USERS.googleUser.id,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  },
};

/**
 * Seed database with test users
 */
export async function seedUsers(
  prisma: TestDatabaseService,
  users: Prisma.UserCreateInput[] = Object.values(TEST_USERS),
) {
  for (const user of users) {
    await prisma.user.create({ data: user });
  }
}

/**
 * Seed database with test refresh tokens
 */
export async function seedRefreshTokens(
  prisma: TestDatabaseService,
  tokens: Prisma.RefreshTokenCreateInput[] = Object.values(TEST_REFRESH_TOKENS),
) {
  for (const token of tokens) {
    await prisma.refreshToken.create({ data: token });
  }
}

/**
 * Seed database with all test data
 */
export async function seedAll(prisma: TestDatabaseService) {
  await seedUsers(prisma);
  await seedRefreshTokens(prisma);
}

/**
 * Clean and seed database with fresh test data
 */
export async function resetAndSeed(prisma: TestDatabaseService) {
  await prisma.cleanDatabase();
  await seedAll(prisma);
}
