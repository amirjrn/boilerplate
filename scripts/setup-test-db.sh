#!/bin/bash

# Test database setup script
set -e

echo "🔧 Setting up test database..."

# Load test environment variables
export $(grep -v '^#' .env.test | xargs)

# Extract database name from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed 's/.*\///')
DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\(.*\):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')
DB_USER=$(echo $DATABASE_URL | sed 's/.*\/\/\(.*\):.*/\1/')

echo "📦 Database: $DB_NAME"
echo "🖥️  Host: $DB_HOST:$DB_PORT"

# Check if database exists, create if it doesn't
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "✅ Database '$DB_NAME' already exists"
else
    echo "🆕 Creating database '$DB_NAME'..."
    createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    echo "✅ Database created"
fi

# Run migrations
echo "🔄 Running migrations..."
DATABASE_URL=$DATABASE_URL npx prisma migrate deploy --schema=./src/domain/schema.prisma

echo "✅ Test database setup complete!"
