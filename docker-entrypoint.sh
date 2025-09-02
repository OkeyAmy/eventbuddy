#!/bin/sh
set -e

# Start the Next.js standalone server in background
node server.js &
PID=$!

# Wait for the server to become healthy (timeout after 60s)
HEALTH_URL="http://127.0.0.1:3000/api/health"
RETRIES=12
SLEEP=5
COUNT=0

until [ $COUNT -ge $RETRIES ]
do
  if curl -sSf "$HEALTH_URL" >/dev/null 2>&1; then
    echo "Server is healthy"
    break
  fi
  COUNT=$((COUNT+1))
  echo "Waiting for server... ($COUNT/$RETRIES)"
  sleep $SLEEP
done

# If server healthy, trigger bot start endpoint using BOT_ADMIN_TOKEN if provided
if curl -sSf "$HEALTH_URL" >/dev/null 2>&1; then
  if [ -n "$BOT_ADMIN_TOKEN" ]; then
    echo "Calling /api/bot/start with admin token"
    curl -s -X POST http://127.0.0.1:3000/api/bot/start -H "x-bot-admin: $BOT_ADMIN_TOKEN" || true
  else
    echo "Calling /api/bot/start without admin token"
    curl -s -X POST http://127.0.0.1:3000/api/bot/start || true
  fi
else
  echo "Server did not become healthy; not starting bot"
fi

# Wait on the server process
wait $PID


