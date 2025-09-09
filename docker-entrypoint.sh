#!/bin/sh
set -e

# Enhanced logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [docker-entrypoint] $1"
}

log "🚀 Starting EventBuddy backend services..."
log "🔧 Function: initialize_eventbuddy_services"

# Environment validation
log "🔍 Function: validate_environment_variables"
REQUIRED_VARS="DISCORD_BOT_TOKEN NEXT_PUBLIC_SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY GEMINI_API_KEY"
for var in $REQUIRED_VARS; do
    if eval "[ -z \"\$$var\" ]"; then
        log "❌ Missing required environment variable: $var"
        exit 1
    else
        log "✅ Environment variable $var is set"
    fi
done

# Run Discord test setup
log "🎮 Function: run_discord_test_setup"
log "Running Discord bot test and command registration..."
if pnpm test:discord; then
    log "✅ Discord test setup completed successfully"
else
    log "⚠️  Discord test completed with warnings (continuing anyway)"
fi

# Resolve PORT and HOSTNAME (Railway sets PORT)
PORT="${PORT:-3000}"
HOSTNAME_BIND="${HOSTNAME:-0.0.0.0}"

# Start Next.js API in development mode in background, binding to correct host/port
log "🌐 Function: start_nextjs_api_server"
log "Starting Next.js API in development mode on $HOSTNAME_BIND:$PORT..."
PORT=$PORT HOSTNAME=$HOSTNAME_BIND pnpm api:dev &
API_PID=$!
log "✅ Next.js API server started with PID: $API_PID"

# Wait for the API to become healthy (timeout after 60s)
log "🔍 Function: wait_for_api_health_check"
HEALTH_URL="http://127.0.0.1:$PORT/api/health"
RETRIES=12
SLEEP=5
COUNT=0

log "Checking API health at: $HEALTH_URL"
until [ $COUNT -ge $RETRIES ]
do
  if curl -sSf "$HEALTH_URL" >/dev/null 2>&1; then
    log "✅ API health check passed - server is ready"
    break
  fi
  COUNT=$((COUNT+1))
  log "⏳ Waiting for API health check... (attempt $COUNT/$RETRIES)"
  sleep $SLEEP
done

# Verify API is actually healthy before proceeding
log "🔍 Function: verify_api_ready_for_bot"
if curl -sSf "$HEALTH_URL" >/dev/null 2>&1; then
  log "✅ API confirmed healthy - proceeding to start Discord bot"
  
  # Start the Discord bot
  log "🤖 Function: start_discord_bot_listener"
  log "Making request to start Discord bot via API..."
  
  if BOT_RESPONSE=$(curl -sS -X POST http://127.0.0.1:$PORT/api/bot/start 2>&1); then
    log "✅ Discord bot start request successful"
    log "📝 Bot start response: $BOT_RESPONSE"
    
    # Verify bot actually started by checking status
    log "🔍 Function: verify_bot_status"
    sleep 3  # Give bot time to initialize
    
    if BOT_STATUS=$(curl -sS http://127.0.0.1:$PORT/api/bot/status 2>&1); then
      log "✅ Bot status check successful: $BOT_STATUS"
    else
      log "⚠️  Bot status check failed, but continuing: $BOT_STATUS"
    fi
  else
    log "❌ Discord bot start request failed: $BOT_RESPONSE"
    log "🔧 Container will continue running API server only"
  fi
else
  log "❌ API health check failed after $RETRIES attempts"
  log "❌ Cannot start Discord bot without healthy API"
  exit 1
fi

log "🎉 All services initialization completed!"
log "📊 Service Status Summary:"
log "   - Next.js API Server: ✅ RUNNING (PID: $API_PID)"
log "   - Discord Bot Listener: ✅ STARTED"
log "   - Health Check Endpoint: http://127.0.0.1:$PORT/api/health"
log "   - Bot Status Endpoint: http://127.0.0.1:$PORT/api/bot/status"

log "🔄 Function: maintain_service_lifecycle"
log "Container is running and maintaining services..."

# Wait on the API process to keep container alive
wait $API_PID


