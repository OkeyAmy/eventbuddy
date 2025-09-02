FROM node:18-alpine AS builder

WORKDIR /app

# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and install dependencies for build
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source and build Next.js in standalone mode
COPY . .
RUN pnpm exec next build --output standalone

FROM node:18-alpine AS runtime
WORKDIR /app

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy the standalone server output from the builder
COPY --from=builder /app/.next/standalone .
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Copy entrypoint which starts the server and triggers bot auto-start
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Entrypoint handles starting the Node server and then calling /api/bot/start
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]