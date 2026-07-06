# Test Suite Documentation

This directory contains comprehensive tests for the Bob application, including unit tests, integration tests, and end-to-end (E2E) tests.

## Test Structure

```
test/
├── helpers/                    # Test utilities and helpers
│   ├── test-database.service.ts   # Test database service
│   ├── seeds.ts                   # Database seeding utilities
│   └── test-helpers.ts            # Test helper functions
├── unit/                       # Unit tests
│   ├── data-access/               # Repository tests
│   ├── service/                   # Service tests
│   ├── guards/                    # Guard tests
│   └── utils/                     # Utility function tests
├── integration/                # Integration tests
│   ├── email-auth.integration.spec.ts
│   └── refresh-token.integration.spec.ts
├── app.e2e-spec.ts            # E2E tests for all endpoints
└── jest-e2e.json              # E2E Jest configuration
```

## Prerequisites

1. **Test Database**: Set up a separate test database to avoid affecting development data
2. **Environment Variables**: Configure `DATABASE_URL` in your `.env` file
3. **Redis**: Ensure Redis is running for OTP and caching tests

## Environment Setup

Add to your `.env` file:

```env
# Test database (separate from development)
DATABASE_URL=postgresql://user:password@localhost:5432/bob_test

# Required for tests
ACCESS_TOKEN_SECRET=your-test-secret
SENDGRID_API_KEY=your-sendgrid-key
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Running Tests

### All Tests

```bash
npm test
```

### Unit Tests Only

```bash
npm test -- --testPathPattern=unit
```

### Integration Tests Only

```bash
npm test -- --testPathPattern=integration
```

### E2E Tests

```bash
npm run test:e2e
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:cov
```

## Test Categories

### Unit Tests

Unit tests test individual components in isolation with mocked dependencies:

- **Repositories**: `UserRepository`, `AuthTokenRepository`
- **Services**: `EmailAuthService`, `GoogleAuthService`, `AppleAuthService`, `RefreshTokenService`, `UserService`
- **Guards**: `AuthGuard`
- **Utils**: Auth utility functions (token generation, password hashing)

### Integration Tests

Integration tests verify complete flows with real database connections:

- Email authentication flow (OTP generation → verification → user creation)
- Refresh token flow (token rotation and revocation)
- Database operations with real Prisma client

### E2E Tests

End-to-end tests verify complete API endpoints with full application context:

- `POST /api/v1/auth/register` - Email registration with OTP
- `POST /api/v1/auth/email` - Email authentication
- `POST /api/v1/auth/google` - Google OAuth authentication
- `POST /api/v1/auth/apple` - Apple OAuth authentication
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /api/v1/user/me` - Authenticated user retrieval

## Test Helpers

### Test Database Service

`TestDatabaseService` provides isolated database connections for tests:

```typescript
const testDb = new TestDatabaseService();
await testDb.onModuleInit();
await testDb.cleanDatabase(); // Clean all data
await testDb.onModuleDestroy();
```

### Seeding Utilities

Predefined test data and seeding functions:

```typescript
import { seedUsers, seedRefreshTokens, TEST_USERS } from './helpers/seeds';

await seedUsers(testDb, [TEST_USERS.emailUser]);
await seedRefreshTokens(testDb, [TEST_REFRESH_TOKENS.validToken]);
```

### Test Helpers

Utility functions for creating test data:

```typescript
import { createTestUser, createTestRefreshToken } from './helpers/test-helpers';

const user = await createTestUser(testDb, { email: 'test@example.com' });
const token = await createTestRefreshToken(testDb, user.id);
```

## Mocking External Services

External services are mocked in tests:

- **SendGrid**: Email sending is mocked to avoid actual email delivery
- **Google OAuth**: Token exchange and verification are mocked
- **Apple OAuth**: Token exchange and verification are mocked
- **Redis**: Uses `ioredis-mock` for unit tests, real Redis for integration/E2E

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data after each test
3. **Descriptive Names**: Use clear, descriptive test names that explain what is being tested
4. **Arrange-Act-Assert**: Follow the AAA pattern for test structure
5. **Mock External Services**: Mock external APIs and services to ensure tests are reliable

## Troubleshooting

### Tests Failing Due to Database Connection

- Ensure `DATABASE_URL` is set correctly
- Verify the test database exists and is accessible
- Check that migrations have been run on the test database

### Redis Connection Errors

- Ensure Redis is running locally or update `REDIS_HOST` in `.env`
- For unit tests, Redis is mocked automatically

### Module Not Found Errors

- Run `npm install` to ensure all dependencies are installed
- Check that TypeScript paths are configured correctly in `tsconfig.json`

## Coverage Goals

- **Unit Tests**: Aim for >80% code coverage
- **Integration Tests**: Cover all critical user flows
- **E2E Tests**: Cover all API endpoints and error scenarios

## Adding New Tests

When adding new features:

1. **Unit Tests**: Create tests for new services, repositories, or utilities
2. **Integration Tests**: Add tests for new authentication flows or complex operations
3. **E2E Tests**: Add endpoint tests to `app.e2e-spec.ts`
4. **Update Seeds**: Add new test data to `seeds.ts` if needed

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm test
    npm run test:e2e
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    ACCESS_TOKEN_SECRET: ${{ secrets.ACCESS_TOKEN_SECRET }}
```
