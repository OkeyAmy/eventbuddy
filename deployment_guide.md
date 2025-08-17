# EventBuddy Deployment Guide

## 🚀 Quick Deploy Options

### Option 1: Render Deployment (Recommended)

1. **Prerequisites**
   - GitHub account with this repository
   - Discord Application created
   - Supabase project
   - Google Gemini API key

2. **Environment Variables**
   ```env
   DISCORD_BOT_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   DISCORD_CLIENT_SECRET=your_client_secret_here
   DISCORD_REDIRECT_URI=https://your-app.onrender.com/api/auth/discord-callback
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Render Setup**
   - Connect GitHub repository
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Add all environment variables

### Option 2: Railway Deployment

1. **Railway Setup**
   ```bash
   railway login
   railway init
   railway add --database postgresql
   railway deploy
   ```

2. **Environment Variables** (same as above)

## 🛠 Local Development

```bash
# Clone repository
git clone <your-repo-url>
cd eventbuddy

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

## 📊 Database Setup (Supabase)

1. **Create Project**: Go to supabase.com/dashboard
2. **Run Schema**: Execute `src/lib/database-schema.sql`
3. **Configure RLS**: Policies are included in schema
4. **Get Keys**: API URL and Service Role Key

## 🤖 Discord Bot Setup

1. **Create Application**: https://discord.com/developers/applications
2. **Bot Permissions**: `8` (Administrator) or specific permissions
3. **OAuth2 Scopes**: `bot applications.commands`
4. **Bot Token**: Save securely

## 🧠 AI Configuration

1. **Gemini API**: Get key from Google AI Studio
2. **Model**: Uses `gemini-pro` for conversations
3. **Rate Limits**: Built-in with exponential backoff

## ✅ Post-Deployment Checklist

- [ ] Bot responds to `/help` command
- [ ] OAuth flow redirects correctly
- [ ] Database migrations successful
- [ ] Environment variables configured
- [ ] Discord bot permissions set
- [ ] Test CSV import functionality
- [ ] Verify AI responses working

## 🔧 Troubleshooting

**Bot Not Responding**
- Check DISCORD_BOT_TOKEN is correct
- Verify bot has necessary permissions
- Check logs for connection errors

**OAuth Errors**
- Confirm DISCORD_REDIRECT_URI matches exactly
- Check CLIENT_ID and CLIENT_SECRET
- Verify Discord app configuration

**Database Issues**
- Run schema with RLS enabled
- Check SUPABASE_SERVICE_ROLE_KEY permissions
- Verify database URL is correct

## 📈 Monitoring

- Use built-in analytics for engagement tracking
- Monitor Discord bot uptime
- Track conversation quality metrics
- Review scheduled job execution

## 🔒 Security Notes

- Never expose bot tokens or service role keys
- Use Row Level Security policies
- Implement rate limiting for API calls
- Regular security audits recommended

---

**Support**: For issues, check logs first, then consult Discord.js and Supabase documentation.