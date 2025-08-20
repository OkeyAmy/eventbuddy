# EventBuddy - AI-Powered Discord Event Management Bot

## 🚀 What We're Building

**EventBuddy** is an intelligent Discord bot that transforms event networking through AI-powered conversations and community building. It helps event organizers:

- **Import attendee data** from CSV exports (Luma, Eventbrite, etc.)
- **Send smart reminders** to attendees before events
- **Create post-event channels** automatically for networking
- **Facilitate conversations** using AI that feels human and engaging
- **Generate analytics** on attendee engagement and community growth
- **Filter spam** while encouraging meaningful interactions

## 🎯 Key Features

### For Event Organizers
- **CSV-based workflow** - No complex integrations needed
- **Privacy-first admin** - All management commands work in private channels/DMs
- **Smart tagging options** - Choose between @everyone or individual mentions
- **Real-time analytics** - Get engagement reports delivered privately
- **Multi-event support** - Manage multiple events per Discord server

### For Attendees  
- **Natural AI conversations** - Bot responds like a helpful human community manager
- **Intelligent networking** - AI suggests relevant connections through @mentions
- **Spam-free environment** - Advanced filtering keeps discussions meaningful
- **Seamless experience** - No special commands needed, just chat naturally

## 🛠 Technology Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Discord.js v14 + Supabase + Google Gemini AI
- **Database**: PostgreSQL (via Supabase) with Row-Level Security
- **Deployment**: Render, Railway, or Docker-ready
- **AI**: Google Gemini API for natural conversation generation

## 📋 Setup Guides

### 🏠 Local Development
See **[LOCAL_SETUP.md](./LOCAL_SETUP.md)** for complete step-by-step local development instructions.

### 🌐 Production Deployment  
See **[PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md)** for detailed deployment instructions with screenshots and troubleshooting.

### 🚀 Quick Deploy
See **[deployment_guide.md](./deployment_guide.md)** for technical deployment reference.

## 🎨 Project Structure

```
eventbuddy/
├── src/
│   ├── components/ui/          # Reusable UI components
│   ├── lib/
│   │   ├── discord-bot.ts      # Main Discord bot logic
│   │   ├── bot-manager.ts      # Bot lifecycle management
│   │   └── database-schema.sql # Supabase database schema
│   ├── pages/
│   │   ├── Index.tsx          # Landing page with Discord OAuth
│   │   ├── dashboard.tsx      # Admin dashboard (planned)
│   │   └── api/               # API routes for bot and auth
│   └── index.css              # Design system & animations
├── LOCAL_SETUP.md             # Local development guide
├── PRODUCTION_GUIDE.md        # Production deployment guide
└── deployment_guide.md        # Technical deployment reference
```

## 🔗 Useful Links

- **Lovable Project**: [Edit in Lovable](https://lovable.dev/projects/aa14331d-cfcc-4e4e-b44f-164fff6d9404)
- **Discord Developer Portal**: [Create Bot Application](https://discord.com/developers/applications)
- **Supabase**: [Database & Authentication](https://supabase.com)
- **Google AI Studio**: [Get Gemini API Key](https://aistudio.google.com/)

## 📞 Support

- Check the troubleshooting sections in the setup guides
- Review Discord.js documentation for bot-related issues
- Consult Supabase docs for database questions
- Use Lovable's Discord community for general support

## 🏆 Success Metrics

- **>60%** attendee engagement rate post-event
- **>95%** spam filtering accuracy  
- **<5 minutes** host onboarding time
- **4.5+/5** host satisfaction score
- **Natural, human-like** AI conversations

---

## 🔧 Production quick ops

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
- Status:
```bash
curl https://your-backend.onrender.com/api/bot/status
```

### Optional automation (Render Cron)
```bash
curl -s -X POST https://your-backend.onrender.com/api/bot/start >/dev/null 2>&1 || true
```

### Secure the endpoints
- Set `BOT_ADMIN_TOKEN` in your environment and require header `x-bot-admin: <token>` on start/stop handlers (docs include guidance).

### package.json scripts you can use locally
- `pnpm api:dev` (Next API locally)
- `pnpm test:discord`
- `pnpm clear:commands`
- `pnpm bot:start:local`
- `pnpm bot:stop:local`
- `pnpm bot:status:local`

### Ensure production envs include
- Backend: `DISCORD_*`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `NEXT_PUBLIC_APP_URL` (and optional `BOT_ADMIN_TOKEN`)
- Frontend: `VITE_DISCORD_CLIENT_ID`, `VITE_SUPABASE_URL`, `VITE_API_URL`

Note: `src/integrations/supabase/client.ts` uses an anon key (expected for client). For production, ensure your deployed frontend uses your own project’s anon key via env-based generation if needed.

If you want us to wire the admin-token check into `src/pages/api/bot/start.ts` and `stop.ts`, let us know.
