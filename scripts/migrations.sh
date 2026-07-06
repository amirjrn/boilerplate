#!/bin/sh

if [ "$NODE_ENV" = "production" ]; then
  echo "Running production migrations..."
  npx prisma migrate deploy
else
  echo "Running development migrations..."
  npx prisma migrate dev --name migration
fi

exec "$@"