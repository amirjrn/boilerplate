import { TestDatabaseService } from './test-database.service';
import { Prisma } from '@prisma/client';
import Redis from 'ioredis-mock';

/**
 * Create a mock Redis instance for testing
 */
export function createMockRedis() {
  return new Redis();
}

/**
 * Create a test user with optional overrides
 */
export async function createTestUser(
  prisma: TestDatabaseService,
  overrides: Partial<Prisma.UserCreateInput> = {},
) {
  const defaultUser: Prisma.UserCreateInput = {
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    avatar: 'https://example.com/avatar.png',
  };

  return prisma.user.create({
    data: { ...defaultUser, ...overrides },
  });
}

/**
 * Create a test refresh token
 */
export async function createTestRefreshToken(
  prisma: TestDatabaseService,
  userId: string,
  overrides: Partial<Prisma.RefreshTokenCreateInput> = {},
) {
  const defaultToken: Prisma.RefreshTokenCreateInput = {
    token: `test-token-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
  };

  return prisma.refreshToken.create({
    data: { ...defaultToken, ...overrides },
  });
}

/**
 * Mock SendGrid mail service
 */
export const mockSendGridSend = jest.fn().mockResolvedValue([
  {
    statusCode: 202,
    body: '',
    headers: {},
  },
]);

/**
 * Mock Google token exchange response
 */
export const mockGoogleTokenResponse = {
  access_token: 'mock-google-access-token',
  token_type: 'Bearer',
  expires_in: 3600,
  id_token: 'mock-google-id-token',
  scope: 'openid profile email',
};

/**
 * Mock Google ID token payload
 */
export const mockGoogleIdTokenPayload = {
  sub: 'google-user-123',
  email: 'google@example.com',
  email_verified: true,
  name: 'Google Test User',
  picture: 'https://example.com/google-avatar.png',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  aud: 'mock-google-client-id',
  iss: 'https://accounts.google.com',
};

/**
 * Mock Apple token exchange response
 */
export const mockAppleTokenResponse = {
  access_token: 'mock-apple-access-token',
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_token: 'mock-apple-refresh-token',
  id_token: 'mock-apple-id-token',
};

/**
 * Mock Apple ID token payload
 */
export const mockAppleIdTokenPayload = {
  sub: 'apple-user-123',
  email: 'apple@example.com',
  email_verified: true,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  aud: 'app.boilerplate.learn',
  iss: 'https://appleid.apple.com',
};

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a random email for testing
 */
export function generateRandomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate a random user ID for testing
 */
export function generateRandomUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Clean up test data after tests
 */
export async function cleanupTestData(prisma: TestDatabaseService) {
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
}
