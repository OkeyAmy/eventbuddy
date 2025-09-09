# 🚂 Railway Deployment Guide

This guide will help you deploy your EventBuddy Discord bot to Railway with the updated Docker configuration that properly runs the backend listener.

## 📋 Prerequisites

- Railway account (https://railway.app)
- GitHub repository with your code
- Discord bot token and configuration
- Supabase project
- Gemini AI API key

## 🚀 Quick Deploy to Railway

### Step 1: Connect to Railway

1. Go to [Railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account and select your EventBuddy repository
5. Railway will automatically detect it's a Docker project

### Step 2: Configure Environment Variables

In your Railway project, go to **"Variables"** and add these environment variables:

```bash
# Discord Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=https://your-railway-app.railway.app/api/auth/discord-callback

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Security (Optional but recommended)
BOT_ADMIN_TOKEN=your_secure_random_token

# Railway Specific
NODE_ENV=development
```

### Step 3: Deploy

1. Click **"Deploy"**
2. Railway will build and deploy your container
3. The deployment will run these essential commands automatically in sequence:
   - **Environment Validation**: Checks all required environment variables
   - `pnpm test:discord` (Discord bot test setup and command registration)
   - `pnpm api:dev` (Next.js API in development mode - starts first)
   - **Health Check**: Waits for API to be ready before proceeding
   - `pnpm bot:start:local` (Start Discord bot listener - starts after API is ready)
   - **Status Verification**: Confirms both services are running properly

### Step 4: Verify Deployment

1. Check the Railway logs to see if all services started properly
2. Visit `https://your-app-name.railway.app/api/health` to verify the API is running
3. Check `https://your-app-name.railway.app/api/bot/status` to verify the bot is running
4. Test your Discord bot in your server

## 🔧 What the Updated Docker Setup Does

### Dockerfile Changes
- Runs in development mode (`NODE_ENV=development`)
- Installs all dependencies (not just production ones)
- Uses single-stage build for simplicity
- Keeps source code for development server

### Entrypoint Script Changes
The `docker-entrypoint.sh` now runs in this order:

1. **Discord Test Setup**: `pnpm test:discord`
   - Sets up Discord bot configuration
   - Registers slash commands
   - Prepares bot for operation

2. **API Server**: `pnpm api:dev`
   - Starts Next.js in development mode
   - Enables hot reloading
   - Runs on port 3000

3. **Bot Start**: `pnpm bot:start:local`
   - Calls the bot start API endpoint
   - Starts the Discord bot listener
   - Bot becomes active in Discord

### Health Checks
- Container includes health checks for the API
- Railway will restart the container if health checks fail
- Ensures your bot stays running

## 🐛 Troubleshooting

### Bot Not Starting
**Symptoms**: Bot appears offline in Discord
**Solutions**:
1. Check Railway logs for error messages
2. Verify all environment variables are set correctly
3. Ensure Discord bot token has proper permissions

### API Not Responding
**Symptoms**: Health check fails or API endpoints don't work
**Solutions**:
1. Check Railway deployment logs
2. Verify Supabase connection
3. Ensure all required environment variables are present

### Discord Test Setup Failing
**Symptoms**: `pnpm test:discord` shows errors
**Solutions**:
1. Check Discord bot permissions in Developer Portal
2. Verify bot token is correct
3. Ensure bot is added to your test server

## 🔄 Redeployment

When you push changes to your GitHub repository:
1. Railway will automatically rebuild and redeploy
2. The container will restart with your new code
3. All three essential commands will run again
4. Your bot should be back online automatically

## 📊 Monitoring

### Railway Dashboard
- **Logs**: View real-time logs from your container
- **Metrics**: Monitor CPU, memory, and network usage
- **Deployments**: See deployment history and status

### Health Endpoints
- `GET /api/health` - Check API health
- `GET /api/bot/status` - Check bot status
- `POST /api/bot/start` - Manually start bot
- `POST /api/bot/stop` - Manually stop bot

## 💡 Tips for Railway

1. **Environment Variables**: Always use Railway's environment variable system, never hardcode secrets
2. **Logs**: Use Railway's log viewer to debug issues
3. **Scaling**: Railway handles scaling automatically
4. **Backups**: Consider setting up database backups in Supabase
5. **Domains**: You can connect custom domains to your Railway app

## 🎯 What's Different from Other Deployments

Unlike Render or other platforms, Railway:
- Automatically detects Docker projects
- Provides better development experience
- Handles environment variables seamlessly
- Offers built-in monitoring and logs
- Supports automatic deployments from GitHub

The updated Docker configuration ensures your Discord bot runs properly with all the essential services (API, Discord test setup, and bot) working together seamlessly.

