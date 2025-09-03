# 🌐 EventBuddy Production Deployment Guide

This comprehensive guide will help you deploy EventBuddy to production, even if you're not technical. We'll cover every step with screenshots and troubleshooting tips.

## 🎯 Deployment Strategy Overview

We'll deploy using this recommended flow:
1. **Connect to Supabase** using Lovable's native integration
2. **Set up Discord Bot** for production
3. **Deploy to Render** (free tier available) - **Next.js API backend**
4. **Deploy to Vercel/Netlify** - **Vite frontend** (or use Render for both)
5. **Configure environment variables**
6. **Test everything works**

This approach is beginner-friendly and mostly free!

## 🔄 Pre-Deployment Checklist

Before we start, make sure you have:
- [ ] Your code working locally (see [LOCAL_SETUP.md](./LOCAL_SETUP.md))
- [ ] A GitHub account
- [ ] A Discord Developer account
- [ ] Access to Lovable project
- [ ] Google account for Gemini AI

## 🗄️ Step 1: Database Setup (Supabase via Lovable)

### Recommended: Use Lovable's Native Integration

1. **In your Lovable project**:
   - Look for the **green "Supabase" button** in the top right corner
   - Click it and follow the setup process
   - This automatically configures your database, authentication, and environment variables

**Why use Lovable's integration?**
- Automatic configuration
- No manual environment variable setup
- Built-in security and RLS policies
- Seamless development to production workflow

<lov-actions>
<lov-link url="https://docs.lovable.dev/integrations/supabase/">Supabase integration docs</lov-link>
</lov-actions>

### Alternative: Manual Supabase Setup

If you prefer manual setup:

1. **Create Production Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Click **"New Project"**
   - Name: "EventBuddy Production"
   - Choose a strong database password
   - Select region closest to your users

2. **Apply Database Schema**:
   - Go to **SQL Editor**
   - Copy contents from `src/lib/database-schema.sql`
   - Run the SQL to create tables

3. **Get Your Keys**:
   - Go to **Settings** → **API**
   - Copy **Project URL** and **service_role** key
   - Save these for later

## 🤖 Step 2: Discord Bot Production Setup

### Create Production Discord Application

1. **Go to Discord Developer Portal**:
   - Visit [discord.com/developers/applications](https://discord.com/developers/applications)
   - Click **"New Application"**
   - Name: "EventBuddy" (your production bot)

2. **Create Bot**:
   - Click **"Bot"** in sidebar
   - Click **"Add Bot"**
   - **Copy the token** - you'll need this!

3. **Set Bot Permissions**:
   - Scroll to **"Bot Permissions"**
   - Select these permissions:
     - ✅ Read Messages/View Channels
     - ✅ Send Messages  
     - ✅ Manage Messages
     - ✅ Embed Links
     - ✅ Read Message History
     - ✅ Add Reactions
     - ✅ Use Slash Commands
     - ✅ Manage Channels (for creating post-event channels)

4. **OAuth2 Setup**:
   - Go to **"OAuth2"** → **"General"**
   - Add redirect URI (we'll update this after deployment)

## 📡 Step 3: Deploy Backend to Render (Next.js API)

### Why Render for Backend?
- Free tier available
- Easy to use for beginners
- Automatic deployments from GitHub
- Built-in environment variable management
- Perfect for Next.js API routes

### Deploy Steps:

1. **Push Code to GitHub**:
   ```bash
   # In your local project folder
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Create Render Account**:
   - Go to [render.com](https://render.com)
   - Sign up using your GitHub account

3. **Create New Web Service**:
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Select your EventBuddy repository

4. **Configure Build Settings**:
   ```
   Name: eventbuddy-backend
   Environment: Node
   Branch: main
   Plan: Free (or choose desired plan)
   Build Command: pnpm install --frozen-lockfile && pnpm exec next build --output standalone
   Start Command: pnpm exec next start
   ```
   Notes:
   - Use `--frozen-lockfile` to ensure deterministic installs on Render.
   - `--output standalone` creates a self-contained Next.js server build which works well on Render.
   - If you use `npm` instead of `pnpm` on Render, change commands to `npm ci` and `npm run build`/`npm run start`.

5. **Set Environment Variables**:
   - Scroll to **"Environment Variables"**
   - Add these variables (get values from your previous setup):

   ```
   NODE_ENV=production
   DISCORD_BOT_TOKEN=your_bot_token_from_step_2
   DISCORD_CLIENT_ID=your_application_id_from_discord
   DISCORD_CLIENT_SECRET=your_client_secret_from_discord
   DISCORD_REDIRECT_URI=https://your-backend.onrender.com/api/auth/discord-callback
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_APP_URL=https://your-frontend-url.com
   BOT_ADMIN_TOKEN=some-long-random-string
   ```

   **Note**: Replace `your-backend` with your actual Render app name!

### Generating a secure `BOT_ADMIN_TOKEN`

You should generate a long, random token and store it securely in Render (set as an environment variable). Below are simple commands you can run locally to create a token.

- Linux / macOS (bash):

```bash
# generates a 64-character hex token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# or using openssl
openssl rand -hex 32
```

- Windows (PowerShell):

```powershell
# using Node (recommended if Node is installed)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Examples to set it locally for testing:

- macOS / Linux:
```bash
export BOT_ADMIN_TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

- PowerShell (Windows):
```powershell
$env:BOT_ADMIN_TOKEN = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

How to add to Render:
- In your Render service dashboard → **Environment** → **Add Environment Variable**:
  - **Key**: `BOT_ADMIN_TOKEN`
  - **Value**: the token you generated
  - Mark it **Private/Secret** in Render so it is not exposed in builds/logs.

Security notes:
- Keep this token secret — treat it like a password. Do not commit it to source control.
- Rotate the token periodically and update Render and any automation that uses it.

6. **Deploy**:
   - Click **"Create Web Service"**
   - Wait for deployment (usually 5-10 minutes)
   - You'll get a URL like `https://your-backend.onrender.com`

7. **Secure and Auto-start the Bot (recommended)**

- By default the start/stop endpoints are unauthenticated. Set `BOT_ADMIN_TOKEN` in Render environment variables (a long random string) and use it to protect admin endpoints.

- Example: secure header when calling start/stop endpoints:

   ```bash
   # Start bot (curl)
   curl -X POST https://your-backend.onrender.com/api/bot/start -H "x-bot-admin: $BOT_ADMIN_TOKEN"

   # Stop bot (curl)
   curl -X POST https://your-backend.onrender.com/api/bot/stop -H "x-bot-admin: $BOT_ADMIN_TOKEN"

   # Check status (no auth usually required but you can require it as well):
   curl https://your-backend.onrender.com/api/bot/status
   ```

- Example Render Cron Job (every 5 minutes) that calls the secured start endpoint and ignores failures:

   ```bash
   curl -s -X POST https://your-backend.onrender.com/api/bot/start -H "x-bot-admin: $BOT_ADMIN_TOKEN" >/dev/null 2>&1 || true
   ```

Notes on auto-starting:
- A Cron Job on Render or an external uptime monitor is the simplest approach to ensure the bot is running after deploys or restarts.
- If you prefer to auto-start as part of the process launch, see the advanced single-process wrapper below, but prefer Cron for clarity and reliability.

## ⚖️ Free deployment alternatives (no-cost or generous free tiers)

If you want to avoid paid Render plans, here are popular free or low-cost options suitable for EventBuddy:

- **Vercel** — Best for Vite/Next.js frontends and serverless API routes; automatic Git deployments on push.
- **Netlify** — Static sites + serverless functions; excellent for Vite frontends.
- **Fly.io** — Run Dockerized apps globally; small free tier for backend services.
- **Supabase** — Use Supabase Edge Functions for lightweight serverless APIs and use the hosted Postgres DB.
- **GitHub Pages** — Free for static frontends (static-only; no backend).
- **Koyeb / Coolify** — Alternatives with free tiers or self-hosted options (Koyeb has a free service tier; Coolify is self-hosted).

Notes:
- For frontend-only hosting, prefer Vercel or Netlify — they auto-deploy from GitHub and provide a CDN.
- For backend Next.js API routes, Vercel (serverless) or Fly.io are good free choices; Supabase Edge Functions work for lightweight APIs.
- Some providers require a payment method to unlock features or remove limits — read free-tier docs and quotas before deploying.

PowerShell tips:
- To push code and trigger automatic deployments (Vercel / Netlify):
```powershell
git add .
git commit -m "Deploy"
git push origin main
```

- To call the bot admin endpoints from PowerShell (include your `x-bot-admin` header):
```powershell
# Start bot
Invoke-WebRequest -Uri "https://your-backend.example.com/api/bot/start" -Method POST -Headers @{"x-bot-admin"="YOUR_TOKEN"}

# Stop bot
Invoke-WebRequest -Uri "https://your-backend.example.com/api/bot/stop" -Method POST -Headers @{"x-bot-admin"="YOUR_TOKEN"}

# Status (returns raw response content)
(Invoke-WebRequest -Uri "https://your-backend.example.com/api/bot/status" -Method GET).Content
```

Read each provider's free-tier limits (bandwidth, concurrency, function execution time) to pick the best fit.

## 🌐 Step 4: Deploy Frontend (Vite)

### Option A: Deploy to Vercel (Recommended for Vite)

1. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

2. **Import Project**:
   - Click **"New Project"**
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite project

3. **Configure Build Settings**:
   ```
   Framework Preset: Vite
   Build Command: pnpm build
   Output Directory: dist
   Install Command: pnpm install
   ```

4. **Set Environment Variables**:
   ```
   VITE_DISCORD_CLIENT_ID=your_discord_client_id
   VITE_SUPABASE_URL=your_supabase_url
   VITE_APP_URL=https://your-frontend.vercel.app
   VITE_API_URL=https://your-backend.onrender.com
   ```

5. **Deploy**:
   - Click **"Deploy"**
   - Wait for build to complete

### Option B: Deploy to Netlify

1. **Go to Netlify**:
   - Visit [netlify.com](https://netlify.com)
   - Sign up with your GitHub account

2. **Import Project**:
   - Click **"New site from Git"**
   - Connect your GitHub repository

3. **Configure Build Settings**:
   ```
   Build command: pnpm build
   Publish directory: dist
   ```

4. **Set Environment Variables**:
   - Go to **Site settings** → **Environment variables**
   - Add the same variables as Vercel

### Option C: Deploy Both to Render

If you prefer to keep everything on Render:

1. **Create Second Web Service**:
   - Click **"New +"** → **"Web Service"**
   - Same repository, different configuration

2. **Configure for Frontend**:
   ```
   Name: eventbuddy-frontend
   Build Command: pnpm install && pnpm build
   Start Command: pnpm preview
   ```

## 🔧 Step 5: Update Discord OAuth

1. **Get Your Backend URL**:
   - From Render dashboard, copy your backend app URL
   - Should look like: `https://eventbuddy-backend-abc123.onrender.com`

2. **Update Discord Application**:
   - Go back to Discord Developer Portal
   - Navigate to your production app → **"OAuth2"** → **"General"**
   - Update redirect URI to: `https://your-backend-url.onrender.com/api/auth/discord-callback`
   - **Save Changes**

3. **Update Environment Variables**:
   - Go to your Render backend service
   - Click **"Environment"**
   - Update these variables with your actual URLs:
     ```
     DISCORD_REDIRECT_URI=https://your-actual-backend-url.onrender.com/api/auth/discord-callback
     NEXT_PUBLIC_APP_URL=https://your-actual-frontend-url.com
     ```

## 🧠 Step 6: AI Configuration

1. **Verify Gemini API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Ensure your API key is active
   - Check usage limits and quotas

2. **Test AI Response**:
   - Once deployed, the bot should respond naturally
   - If responses seem robotic, check API key configuration

## ✅ Step 7: Testing Your Production Deployment

### Test the Backend API

1. **Check API Health**:
   - Visit `https://your-backend.onrender.com/api/health`
   - Should return a success response

2. **Test Bot Start Endpoint**:
   ```bash
   curl -X POST https://your-backend.onrender.com/api/bot/start
   ```

### Test the Frontend

1. **Visit Your Frontend URL**:
   - Go to your Vercel/Netlify/Render frontend URL
   - Should see the EventBuddy landing page
   - Click **"Connect AI to Discord"**

2. **Test OAuth Flow**:
   - Should redirect to Discord
   - Authorize the application
   - Should redirect back successfully

### Test the Discord Bot

1. **Add Bot to Your Server**:
   - In Discord Developer Portal → **"OAuth2"** → **"URL Generator"**
   - Select scopes: `bot` and `applications.commands`
   - Select permissions you configured earlier
   - Copy URL and open in browser
   - Add bot to your Discord server

2. **Test Bot Commands**:
   - Create a private channel or use DMs
   - Try: `/help` (should work)
   - Test admin commands in private channels only

### Test CSV Import (Full Workflow)

1. **Prepare Test CSV**:
   ```csv
   Name,Email,Discord Handle,RSVP Status
   John Doe,john@example.com,JohnDoe#1234,Confirmed
   Jane Smith,jane@example.com,JaneSmith,Confirmed
   ```

2. **Test Import Flow**:
   - In Discord, go to a private channel or DM with bot
   - Use import command with your test CSV
   - Verify attendees are stored correctly

## 🔒 Step 8: Security & Performance

### Security Checklist:
- [ ] Bot token is secret and not exposed
- [ ] Supabase service role key is secure
- [ ] OAuth redirect URI matches exactly
- [ ] Database has Row Level Security enabled
- [ ] No sensitive data in logs
- [ ] Frontend environment variables are public-safe (VITE_*)

### Performance Optimization:
- [ ] Enable Render auto-scaling if needed
- [ ] Monitor Supabase usage quotas
- [ ] Set up Gemini API usage alerts
- [ ] Configure appropriate bot rate limiting
- [ ] Use CDN for frontend assets (Vercel/Netlify provide this)

## 📊 Step 9: Monitoring & Analytics

### Set Up Monitoring:

1. **Render Monitoring**:
   - Check **"Logs"** tab for errors
   - Monitor **"Metrics"** for performance
   - Set up alerts for downtime

2. **Supabase Monitoring**:
   - Monitor database performance
   - Check API usage and quotas
   - Review security logs

3. **Discord Bot Health**:
   - Monitor bot uptime in Discord
   - Check command response times
   - Review message engagement rates

4. **Frontend Monitoring**:
   - Vercel/Netlify provide built-in analytics
   - Monitor page load times
   - Track user engagement

## 🐛 Troubleshooting Common Issues

### Bot Won't Start
**Symptoms**: Bot appears offline, commands don't work
**Solutions**:
1. Check bot token in environment variables
2. Verify bot permissions in Discord
3. Review Render logs for errors
4. Ensure all required environment variables are set

### OAuth Errors
**Symptoms**: "Invalid redirect URI" or OAuth failures
**Solutions**:
1. Double-check redirect URI matches exactly
2. Ensure HTTPS is used (not HTTP) for production
3. Verify client ID and secret are correct
4. Check Discord application settings

### Database Connection Issues
**Symptoms**: Data not saving, connection errors
**Solutions**:
1. Verify Supabase URL and keys
2. Check database permissions
3. Ensure RLS policies are applied
4. Review Supabase logs

### AI Not Responding
**Symptoms**: Bot sends messages but no AI responses
**Solutions**:
1. Check Gemini API key is valid
2. Verify API quotas aren't exceeded
3. Review error logs for AI service issues
4. Test with simple prompts first

### Frontend Not Loading
**Symptoms**: Frontend shows errors or won't load
**Solutions**:
1. Check build logs in Vercel/Netlify
2. Verify environment variables are set correctly
3. Ensure API URL points to correct backend
4. Check browser console for errors

### Deployment Failures
**Symptoms**: Build fails, app won't start
**Solutions**:
1. Check build logs in deployment platform
2. Verify all dependencies are installed
3. Ensure Node.js version compatibility
4. Check for syntax errors in code

## 🚀 Step 10: Going Live

### Final Checklist Before Going Live:
- [ ] All tests pass
- [ ] Bot responds correctly in production
- [ ] OAuth flow works end-to-end
- [ ] CSV import processes successfully
- [ ] AI responses are natural and relevant
- [ ] Analytics tracking works
- [ ] Monitoring is set up
- [ ] Backup and recovery plan in place
- [ ] Frontend and backend communicate properly

### Announcing Your Bot:
1. **Create Invite Link**:
   - Discord Developer Portal → OAuth2 → URL Generator
   - Generate public invite link for other servers

2. **Documentation for Users**:
   - Create simple user guide
   - Document admin commands
   - Set up support channel

3. **Marketing Your Bot**:
   - Submit to Discord bot listings
   - Share on social media
   - Reach out to event organizer communities

## 📈 Step 11: Scaling Considerations

### When Your Bot Grows:

1. **Upgrade Hosting**:
   - Move from free to paid Render plan
   - Consider dedicated database instances
   - Implement load balancing if needed

2. **Database Scaling**:
   - Monitor Supabase usage
   - Optimize queries for performance
   - Consider connection pooling

3. **AI Usage Management**:
   - Monitor Gemini API costs
   - Implement smarter response filtering
   - Consider response caching for common queries

4. **Multi-Guild Support**:
   - Test bot with multiple Discord servers
   - Ensure data isolation works correctly
   - Monitor resource usage per guild

5. **Frontend Optimization**:
   - Implement lazy loading
   - Add service worker for offline support
   - Optimize bundle size

## 🎉 Congratulations!

You've successfully deployed EventBuddy to production! Your AI-powered Discord bot is now ready to help event organizers create engaging communities.

### What's Next?
- Monitor your first few events closely
- Gather feedback from users
- Iterate on AI response quality
- Consider adding new features based on user needs

### Need Help?
- Check Render logs for technical issues
- Review Discord.js documentation for bot questions
- Consult Supabase docs for database issues
- Ask in the Lovable Discord community

Remember: Successful deployment is just the beginning. The real value comes from helping event organizers create amazing community experiences!

## 🚦 Bot Startup and Operations (Production)

After deploying the backend, the Discord bot does not start automatically. You must explicitly start it via the API.

- Start bot (PowerShell):
```powershell
Invoke-WebRequest -Uri "https://your-backend.onrender.com/api/bot/start" -Method POST
```

- Start bot (curl):
```bash
curl -X POST https://your-backend.onrender.com/api/bot/start
```

- Stop bot:
```bash
curl -X POST https://your-backend.onrender.com/api/bot/stop
```

- Check status:
```bash
curl https://your-backend.onrender.com/api/bot/status
```

What to expect after starting:
- Bot appears online in your Discord server
- Slash commands are available
- API returns `{ running: true }` from `/api/bot/status`

If you skip the start call:
- Bot remains offline and won’t respond
- Status will show `{ running: false }`

## 🤖 Automate Bot Start (Recommended)

Choose one of these options to auto-start the bot after deploy/restart:

- Render Cron Job (every 5 minutes):
  - Create a Cron Job on Render
  - Command:
    ```bash
    curl -s -X POST https://your-backend.onrender.com/api/bot/start >/dev/null 2>&1 || true
    ```
  - This keeps the bot running even after restarts

- External Uptime/Automation service:
  - Use UptimeRobot, GitHub Actions, or any scheduler to POST the start endpoint on deploy

- Advanced (single-process wrapper):
  - Start Command (bash):
    ```bash
    bash -lc 'pnpm exec next start & sleep 10 && curl -s -X POST https://your-backend.onrender.com/api/bot/start || true; wait -n'
    ```
  - Note: This is optional and advanced; prefer Cron for simplicity

## 🔐 Secure the Start/Stop Endpoints (Hardening)

By default, the bot endpoints accept requests without auth. In production, protect them:

- Add a shared secret header (example):
  - Set env `BOT_ADMIN_TOKEN=some-long-random-string`
  - Send header `x-bot-admin: <token>` in all start/stop requests
  - Update your API handlers to verify the header before executing

- Restrict by IP (if possible)
- Never expose these URLs publicly without protection

## 🧭 Production Quick Ops Summary

- Start bot:
  - PowerShell: `Invoke-WebRequest -Uri "https://your-backend.onrender.com/api/bot/start" -Method POST`
  - curl: `curl -X POST https://your-backend.onrender.com/api/bot/start`
- Stop bot: `curl -X POST https://your-backend.onrender.com/api/bot/stop`
- Status: `curl https://your-backend.onrender.com/api/bot/status`

Tip: Bookmark these in your runbook or scripts so your team can operate the bot easily.