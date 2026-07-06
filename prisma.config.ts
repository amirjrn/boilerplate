import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';
import path from 'node:path';

export default defineConfig({
  schema: path.join('src', 'domain'),
  migrations: {
    path: path.join('src', 'domain', 'migrations'),
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
