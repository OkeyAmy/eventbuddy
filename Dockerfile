FROM node:18-alpine

WORKDIR /app

# Install curl for healthchecks and other utilities
RUN apk add --no-cache curl bash

# Enable corepack and install pnpm with specific version for consistency
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

# Copy package files and install all dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose default port (Railway will map its PORT env var)
EXPOSE 3000

# Railway-specific environment variables
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Health check optimized for Railway (respect dynamic PORT)
HEALTHCHECK --interval=30s --timeout=15s --start-period=90s --retries=3 \
  CMD sh -c 'curl -f http://127.0.0.1:${PORT:-3000}/api/health || exit 1'

# Copy entrypoint which starts the API, runs Discord test, and starts bot
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Railway deployment labels
LABEL railway.service="eventbuddy-bot"
LABEL railway.type="web"

# Entrypoint handles starting the Next.js API in dev mode, Discord test, and bot
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]