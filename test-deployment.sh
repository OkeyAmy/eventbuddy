#!/bin/bash

# Test script for verifying Docker deployment
# This script tests the complete deployment flow locally before Railway deployment

set -e

echo "🧪 Testing EventBuddy Docker Deployment Flow"
echo "=============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t eventbuddy-test .

echo "✅ Docker image built successfully"

# Check if required environment variables file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << EOF
# Discord Configuration (REQUIRED)
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here

# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key_here

# AI Configuration (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
BOT_ADMIN_TOKEN=your_secure_random_token_here
NODE_ENV=development
EOF
    echo "📝 Please fill in the .env file with your actual values and run this script again."
    exit 1
fi

echo "✅ Environment file found"

# Run the container with environment variables
echo "🚀 Starting container with environment variables..."
docker run -d \
    --name eventbuddy-test \
    --env-file .env \
    -p 3000:3000 \
    eventbuddy-test

echo "✅ Container started"

# Wait a moment for the container to initialize
echo "⏳ Waiting for services to initialize..."
sleep 10

# Test the health endpoint
echo "🔍 Testing API health endpoint..."
HEALTH_RETRIES=10
HEALTH_COUNT=0

until [ $HEALTH_COUNT -ge $HEALTH_RETRIES ]
do
  if curl -sSf "http://localhost:3000/api/health" > /dev/null; then
    echo "✅ API health check passed"
    break
  fi
  HEALTH_COUNT=$((HEALTH_COUNT+1))
  echo "⏳ Waiting for API... ($HEALTH_COUNT/$HEALTH_RETRIES)"
  sleep 5
done

if [ $HEALTH_COUNT -ge $HEALTH_RETRIES ]; then
    echo "❌ API health check failed"
    echo "📋 Container logs:"
    docker logs eventbuddy-test
    docker stop eventbuddy-test
    docker rm eventbuddy-test
    exit 1
fi

# Test the bot status endpoint
echo "🤖 Testing bot status endpoint..."
if BOT_STATUS=$(curl -sS "http://localhost:3000/api/bot/status"); then
    echo "✅ Bot status check passed"
    echo "📝 Bot status: $BOT_STATUS"
else
    echo "⚠️  Bot status check failed (this might be normal if bot hasn't started yet)"
fi

# Show container logs
echo "📋 Container logs (last 20 lines):"
docker logs --tail 20 eventbuddy-test

echo ""
echo "🎉 Deployment test completed!"
echo "📊 Results:"
echo "   - Docker build: ✅ SUCCESS"
echo "   - Container start: ✅ SUCCESS"
echo "   - API health: ✅ SUCCESS"
echo "   - Bot status: ✅ CHECKED"
echo ""
echo "🧹 Cleaning up test container..."
docker stop eventbuddy-test
docker rm eventbuddy-test

echo "✅ Test complete! Your deployment should work on Railway."
echo ""
echo "🚂 To deploy to Railway:"
echo "   1. Push your code to GitHub"
echo "   2. Connect your repo to Railway"
echo "   3. Set the environment variables in Railway dashboard"
echo "   4. Deploy!"
