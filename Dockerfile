FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate Client
RUN npx prisma generate

# Build the application
RUN npm run build

# --- Production Stage ---
FROM node:22-alpine AS production

WORKDIR /app

COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

COPY scripts/migrations.sh /usr/local/bin/migrations.sh
RUN chmod +x /usr/local/bin/migrations.sh 

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/migrations.sh"]

CMD [ "npm", "run", "start:prod" ]
