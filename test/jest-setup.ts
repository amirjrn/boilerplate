import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.test first (contains DATABASE_URL for test database)
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// Load .env for any missing variables (will not overwrite existing)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
