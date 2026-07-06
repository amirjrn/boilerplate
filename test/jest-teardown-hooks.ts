/**
 * Per-worker teardown to close Redis connection.
 * Uses a flag to ensure we only disconnect once per worker,
 * even though afterAll runs after each test file.
 */

type RedisClient = {
  disconnect?: (reconnect?: boolean) => void;
  removeAllListeners?: () => void;
  status?: string;
};

let disconnected = false;

afterAll(() => {
  if (disconnected) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access
    const redis = require('../src/init/redis').redis as RedisClient;
    if (redis?.status === 'end') return; // Already disconnected

    redis.removeAllListeners?.();
    redis.disconnect?.(false);
    disconnected = true;
  } catch {
    // Redis module not loaded
    console.warn('Redis module not found during teardown.');
  }
});
