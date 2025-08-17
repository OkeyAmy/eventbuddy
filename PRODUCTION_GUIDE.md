# 🌐 EventBuddy Production Deployment Guide

This comprehensive guide will help you deploy EventBuddy to production, even if you're not technical. We'll cover every step with screenshots and troubleshooting tips.

## 🎯 Deployment Strategy Overview

We'll deploy using this recommended flow:
1. **Connect to Supabase** using Lovable's native integration
2. **Set up Discord Bot** for production
3. **Deploy to Render** (free tier available)
4. **Configure environment variables**
5. **Test everything works**

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

## 📡 Step 3: Deploy to Render

### Why Render?
- Free tier available
- Easy to use for beginners
- Automatic deployments from GitHub
- Built-in environment variable management

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
   Name: eventbuddy
   Environment: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

5. **Set Environment Variables**:
   - Scroll to **"Environment Variables"**
   - Add these variables (get values from your previous setup):

   ```
   NODE_ENV=production
   DISCORD_BOT_TOKEN=your_bot_token_from_step_2
   DISCORD_CLIENT_ID=your_application_id_from_discord
   DISCORD_CLIENT_SECRET=your_client_secret_from_discord
   DISCORD_REDIRECT_URI=https://your-app.onrender.com/api/auth/discord-callback
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
   ```

   **Note**: Replace `your-app` with your actual Render app name!

6. **Deploy**:
   - Click **"Create Web Service"**
   - Wait for deployment (usually 5-10 minutes)
   - You'll get a URL like `https://your-app.onrender.com`

## 🔧 Step 4: Update Discord OAuth

1. **Get Your Deployment URL**:
   - From Render dashboard, copy your app URL
   - Should look like: `https://eventbuddy-abc123.onrender.com`

2. **Update Discord Application**:
   - Go back to Discord Developer Portal
   - Navigate to your production app → **"OAuth2"** → **"General"**
   - Update redirect URI to: `https://your-app-url.onrender.com/api/auth/discord-callback`
   - **Save Changes**

3. **Update Environment Variables in Render**:
   - Go to your Render service
   - Click **"Environment"**
   - Update these variables with your actual URL:
     ```
     DISCORD_REDIRECT_URI=https://your-actual-url.onrender.com/api/auth/discord-callback
     NEXT_PUBLIC_APP_URL=https://your-actual-url.onrender.com
     ```

## 🧠 Step 5: AI Configuration

1. **Verify Gemini API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Ensure your API key is active
   - Check usage limits and quotas

2. **Test AI Response**:
   - Once deployed, the bot should respond naturally
   - If responses seem robotic, check API key configuration

## ✅ Step 6: Testing Your Production Deployment

### Test the Web Interface

1. **Visit Your App URL**:
   - Go to your Render deployment URL
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

## 🔒 Step 7: Security & Performance

### Security Checklist:
- [ ] Bot token is secret and not exposed
- [ ] Supabase service role key is secure
- [ ] OAuth redirect URI matches exactly
- [ ] Database has Row Level Security enabled
- [ ] No sensitive data in logs

### Performance Optimization:
- [ ] Enable Render auto-scaling if needed
- [ ] Monitor Supabase usage quotas
- [ ] Set up Gemini API usage alerts
- [ ] Configure appropriate bot rate limiting

## 📊 Step 8: Monitoring & Analytics

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

### Deployment Failures
**Symptoms**: Build fails, app won't start
**Solutions**:
1. Check build logs in Render
2. Verify all dependencies are installed
3. Ensure Node.js version compatibility
4. Check for syntax errors in code

## 🚀 Step 9: Going Live

### Final Checklist Before Going Live:
- [ ] All tests pass
- [ ] Bot responds correctly in production
- [ ] OAuth flow works end-to-end
- [ ] CSV import processes successfully
- [ ] AI responses are natural and relevant
- [ ] Analytics tracking works
- [ ] Monitoring is set up
- [ ] Backup and recovery plan in place

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

## 📈 Step 10: Scaling Considerations

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