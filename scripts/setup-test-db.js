const { execSync } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');
const { Client } = require('pg');

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../.env.test') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.test');
  process.exit(1);
}

// Parse database URL
const url = new URL(DATABASE_URL);
const dbName = url.pathname.slice(1).split('?')[0]; // Remove leading / and query params
const connectionConfig = {
  host: url.hostname,
  port: parseInt(url.port) || 5432,
  user: url.username,
  password: url.password,
};

async function setupTestDatabase() {
  console.log('🔧 Setting up test database...');
  console.log(`📦 Database: ${dbName}`);
  console.log(`🖥️  Host: ${connectionConfig.host}:${connectionConfig.port}`);

  // Connect to postgres database to check/create test database
  const client = new Client({
    ...connectionConfig,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await client.connect();

    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName],
    );

    if (result.rows.length > 0) {
      console.log(`✅ Database '${dbName}' already exists`);
    } else {
      console.log(`🆕 Creating database '${dbName}'...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log('✅ Database created');
    }

    await client.end();

    // Run migrations
    console.log('🔄 Running migrations...');
    execSync(
      `DATABASE_URL=${DATABASE_URL} npx prisma migrate deploy --schema=./src/domain/schema.prisma`,
      { stdio: 'inherit' },
    );

    console.log('✅ Test database setup complete!');
  } catch (error) {
    console.error('❌ Error setting up test database:', error.message);
    await client.end();
    process.exit(1);
  }
}

setupTestDatabase();
