# 🏠 EventBuddy Local Development Setup

This guide will walk you through setting up EventBuddy for local development, step by step. No technical background required!

## 📋 Prerequisites

Before we start, you'll need to install a few tools on your computer:

### 1. Install Node.js
- Go to [nodejs.org](https://nodejs.org/)
- Download the **LTS version** (recommended for most users)
- Run the installer and follow the prompts
- To verify installation, open your terminal/command prompt and type:
  ```bash
  node --version
  npm --version
  ```

### 2. Install pnpm (Package Manager)
- Open your terminal/command prompt and run:
  ```bash
  npm install -g pnpm
  ```
- To verify: `pnpm --version`

### 3. Install Git (if not already installed)
- Go to [git-scm.com](https://git-scm.com/)
- Download and install Git for your operating system
- To verify: `git --version`

### 4. Install a Code Editor (Optional but Recommended)
- Download [Visual Studio Code](https://code.visualstudio.com/) - it's free and beginner-friendly

## 🔧 Project Setup

### Step 1: Clone the Repository
Open your terminal/command prompt and run:

```bash
# Clone your project (replace with your actual GitHub URL)
git clone https://github.com/YOUR_USERNAME/eventbuddy.git

# Navigate to the project folder
cd eventbuddy

# Install project dependencies
pnpm install
```

### Step 2: Environment Variables Setup
1. In your project folder, find the file called `.env.example`
2. Copy it and rename the copy to `.env.local`
3. Open `.env.local` in your text editor

**Important**: We'll fill in these values in the next steps. Don't worry if they look confusing right now!

## 🤖 Discord Bot Setup

### Step 1: Create a Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Give it a name like "EventBuddy Dev" 
4. Click **"Create"**

### Step 2: Create the Bot
1. In your application, click **"Bot"** in the left sidebar
2. Click **"Add Bot"**
3. Under **"Token"**, click **"Copy"**
4. In your `.env.local` file, paste it as:
   ```
   DISCORD_BOT_TOKEN=your_copied_token_here
   ```

### Step 3: Get Application ID
1. Go to **"General Information"** in the left sidebar
2. Copy the **"Application ID"**
3. In your `.env.local` file, add:
   ```
   DISCORD_CLIENT_ID=your_application_id_here
   VITE_DISCORD_CLIENT_ID=your_application_id_here
   ```

### Step 4: Create Client Secret
1. Still in **"General Information"**
2. Under **"Client Secret"**, click **"Reset Secret"**, then **"Copy"**
3. In your `.env.local` file, add:
   ```
   DISCORD_CLIENT_SECRET=your_client_secret_here
   ```

### Step 5: Set Redirect URI
1. Go to **"OAuth2"** → **"General"** in the left sidebar
2. Under **"Redirects"**, click **"Add Redirect"**
3. Enter: `http://localhost:3000/api/auth/discord-callback`
4. Click **"Save Changes"**
5. In your `.env.local`, add:
   ```
   DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord-callback
   ```

## 🗄️ Database Setup (Supabase)

**Important**: Since this project uses backend functionality (database, authentication), you'll need to connect to Supabase using Lovable's native integration.

### Using Lovable's Supabase Integration (Recommended)
1. In your Lovable project, click the **green Supabase button** in the top right
2. Follow the setup process to connect to Supabase
3. Once connected, Lovable will automatically handle:
   - Database creation
   - Table setup
   - Authentication configuration
   - Environment variables

This is the recommended approach as it automatically configures everything for you!

### Manual Supabase Setup (Alternative)
If you prefer to set up Supabase manually:

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** and sign up
3. Click **"New Project"**
4. Choose your organization and fill in:
   - **Name**: EventBuddy Dev
   - **Database Password**: Create a strong password and save it!
   - **Region**: Choose closest to your location
5. Click **"Create new project"** (this takes ~2 minutes)

6. Once created, go to **Settings** → **API**
7. Copy the **Project URL** and add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   ```
8. Copy the **service_role secret** (not anon public!) and add:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

9. **Set up the database**:
   - Go to **SQL Editor** in Supabase
   - Copy the contents of `src/lib/database-schema.sql`
   - Paste it in the SQL editor
   - Click **"Run"**

## 🧠 AI Setup (Google Gemini)

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **"Get API Key"** → **"Create API Key"**
4. Copy the key and add to `.env.local`:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## 🚀 Running the Application

**Important**: This project uses a hybrid setup with Vite frontend and Next.js API routes. You need to run both services.

### Step 1: Start the Discord Bot Server (Next.js API)
Open a **new terminal/command prompt** and run:

```bash
# Navigate to your project directory
cd buddy-event-spark

# Start the Next.js server for Discord bot API endpoints
pnpm exec next
```

You should see output indicating the Next.js server is running on port 3000.

**⚠️ CRITICAL**: The Discord bot will NOT start automatically just by running this command. You MUST complete Step 4 below to actually start the bot.

### Step 2: Start the Frontend (Vite)
Open **another terminal/command prompt** and run:

```bash
# Navigate to your project directory
cd buddy-event-spark

# Start the Vite development server
pnpm dev
```

You should see output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 3: Access the Application
1. **Frontend**: Open your browser to [http://localhost:5173](http://localhost:5173) (Vite)
2. **Dashboard**: Go to [http://localhost:3000/dashboard](http://localhost:3000/dashboard) (Next.js)
3. **API Endpoints**: Available at [http://localhost:3000/api/*](http://localhost:3000/api/*)

### Step 4: Start the Discord Bot (REQUIRED!)
**This step is essential!** Running `pnpm exec next` only starts the server - it does NOT start the Discord bot.

Once both servers are running, you MUST start the Discord bot by making a POST request to the bot start endpoint:

**Option A: Using PowerShell (Windows)**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/bot/start" -Method POST
```

**Option B: Using curl (Mac/Linux)**
```bash
curl -X POST http://localhost:3000/api/bot/start
```

**Option C: Using the Dashboard**
1. Go to [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
2. Click the "Start Bot" button if available

**What happens when you start the bot:**
- The bot connects to Discord using your bot token
- Slash commands become available in your Discord server
- The bot starts listening for messages and commands
- You should see the bot appear online in your Discord server

**If you skip this step:**
- The bot will remain offline
- Slash commands won't work
- The bot won't respond to messages
- You'll see "Bot is offline" in Discord

## 🧪 Testing Your Setup

### Check List:
- [ ] Next.js server running on localhost:3000
- [ ] Vite frontend running on localhost:5173
- [ ] Discord bot started successfully via API
- [ ] Web app loads at localhost:5173
- [ ] Dashboard accessible at localhost:3000/dashboard
- [ ] Discord OAuth flow works (redirects properly)
- [ ] Bot appears online in your Discord server
- [ ] Database connection successful (check Supabase dashboard)
- [ ] No error messages in either terminal

### Test Discord Bot Connection
Before proceeding, test if your Discord bot can connect:

```bash
# Test Discord bot connection
node test-discord-setup.js
```

**Important**: Update the `DISCORD_BOT_TOKEN` in `test-discord-setup.js` with your actual bot token first!

You should see:
```
✅ Test successful! Bot connected as YourBot#1234
📊 Bot is in X servers
🎯 EventBuddy Discord bot is ready for use!
```

If you see an error, double-check your bot token and permissions.

### Test Discord Commands
Once the bot is running, test these commands in your Discord server:

1. **Basic Commands**:
   - `/help` - Should show available commands
   - `/input Hello!` - Should get AI response

2. **Admin Commands** (if you have admin permissions):
   - `/import_event` - Test CSV import
   - `/analytics` - Check event analytics

### Clear and Register Commands (Optional)
If you need to reset Discord slash commands:

```bash
# Clear existing commands and register new ones
node clear-commands.js
```

**Important**: Update the `DISCORD_BOT_TOKEN` and `DEV_GUILD_ID` in `clear-commands.js` with your actual values first!

This will register these commands:
- `/help` - Show available commands
- `/input` - Send message to AI
- `/import_event` - Import CSV data (Admin)
- `/end_event` - End current event (Admin)
- `/analytics` - Get event analytics (Admin)

## 🤖 Discord Bot Commands

EventBuddy comes with several powerful slash commands for event management:

### Basic Commands
- **`/help`** - Shows all available commands and their usage
- **`/input [message]`** - Sends a message to the AI for processing and gets a response

### Admin Commands (Require Admin/Manage Server permissions)
- **`/import_event [event_name] [csv_file]`** - Imports attendee data from a CSV file
  - `event_name`: Name of the event (e.g., "Tech Conference 2024")
  - `csv_file`: CSV file attachment with columns: Name, Email, Discord Handle, RSVP Status

- **`/end_event`** - Ends the current event and creates a post-event channel for networking

- **`/analytics [event_name]`** - Shows analytics for events
  - `event_name`: Optional - specific event to analyze (shows all events if not specified)

### CSV File Format
Your CSV file should have these columns:
```csv
Name,Email,Discord Handle,RSVP Status
John Doe,john@example.com,JohnDoe#1234,Confirmed
Jane Smith,jane@example.com,JaneSmith,Confirmed
Bob Wilson,bob@example.com,BobWilson#5678,Pending
```

### Command Permissions
- **Basic commands** (`/help`, `/input`): Available to all users
- **Admin commands** (`/import_event`, `/end_event`, `/analytics`): Require "Manage Server" permission
- **Bot permissions needed**: Send Messages, Read Message History, Use Slash Commands, Manage Channels

### Testing Commands
1. **Start the bot** using the API endpoint
2. **Go to your Discord server** where the bot is added
3. **Type `/`** to see available commands
4. **Test basic commands** first (`/help`, `/input`)
5. **Test admin commands** if you have the right permissions

### Common Issues & Solutions:

**"Module not found" errors:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Port conflicts:**
- If port 3000 is in use, the Next.js server will show an error
- If port 5173 is in use, Vite will automatically use the next available port
- Check what's using the ports: `netstat -ano | findstr :3000` (Windows) or `lsof -i :3000` (Mac/Linux)

**Discord OAuth errors:**
- Double-check your redirect URI matches exactly
- Ensure client ID and secret are correct
- Make sure you saved changes in Discord Developer Portal

**Database connection errors:**
- Verify Supabase URL and key are correct
- Check if the database schema was applied successfully
- Ensure you're using the service_role key, not anon key

**Bot won't start:**
- Verify bot token is correct and copied fully
- Check bot permissions in Discord Developer Portal
- Ensure bot is enabled in the Bot section
- Check Next.js server logs for errors
- **Most common issue**: Forgetting to run the API call after starting the server

**Bot appears offline in Discord:**
- You must complete BOTH steps: run `pnpm exec next` AND make the API call
- Check if the API call returned a success response
- Verify the bot token in your `.env.local` file
- Restart both servers and try the startup sequence again

**API call fails:**
- Ensure the Next.js server is running first
- Check if port 3000 is available
- Verify the API endpoint is accessible at `http://localhost:3000/api/bot/start`
- Check Next.js server logs for any startup errors

## 📝 Development Workflow

1. **Make changes** to your code
2. **Save files** - both servers will automatically reload
3. **Test changes** in your browser and Discord
4. **Check both terminals** for any error messages
5. **Commit changes** to Git when ready:
   ```bash
   git add .
   git commit -m "Describe your changes"
   git push
   ```

## 🎯 Next Steps

Once your local setup is working:
1. Test the full event workflow with a small CSV file
2. Experiment with AI responses in your test Discord server
3. Review the code structure to understand how it works
4. When ready to deploy, see **[PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md)**

## 🆘 Getting Help

If you're stuck:
1. Check the error messages in both terminals - they often point to the exact issue
2. Verify all environment variables are set correctly
3. Ensure all prerequisites are installed properly
4. Review the troubleshooting section above
5. Ask for help in the Lovable Discord community

Remember: Local development is for testing and building new features. Once everything works locally, you can deploy to production with confidence!

## 🚨 Common Discord Bot Issues & Solutions

### Bot Won't Connect
**Symptoms**: Bot shows as offline, test script fails
**Solutions**:
1. **Check bot token**: Ensure it's copied correctly from Discord Developer Portal
2. **Verify bot permissions**: Bot needs "Send Messages", "Use Slash Commands", "Read Message History"
3. **Check bot status**: Ensure bot is enabled in Discord Developer Portal → Bot section
4. **Server permissions**: Bot needs proper permissions in your Discord server

### Slash Commands Not Working
**Symptoms**: Commands don't appear when typing `/`
**Solutions**:
1. **Wait for registration**: Commands can take up to 1 hour to appear globally
2. **Check guild commands**: Use `node clear-commands.js` to register commands to your specific server
3. **Verify bot permissions**: Bot needs "Use Slash Commands" permission
4. **Check command scope**: Ensure commands are registered to the right server

### AI Not Responding
**Symptoms**: Bot sends messages but no AI responses
**Solutions**:
1. **Check Gemini API key**: Verify it's valid and has quota remaining
2. **Check environment variables**: Ensure `GEMINI_API_KEY` is set correctly
3. **Review logs**: Check Next.js server logs for AI service errors
4. **Test with simple input**: Try `/input hello` first

### CSV Import Fails
**Symptoms**: `/import_event` command doesn't work
**Solutions**:
1. **Check file format**: Ensure CSV has correct columns (Name, Email, Discord Handle, RSVP Status)
2. **Verify permissions**: You need "Manage Server" permission
3. **Check file size**: Large files may timeout
4. **Database connection**: Ensure Supabase is properly configured

### Bot Missing from Server
**Symptoms**: Bot was added but disappeared
**Solutions**:
1. **Check invite link**: Use proper OAuth2 invite link with correct scopes
2. **Verify bot permissions**: Ensure bot has required permissions
3. **Server settings**: Check if bot was accidentally removed
4. **Re-invite**: Use the invite link again from Discord Developer Portal

### Environment Variable Issues
**Common mistakes**:
- Using `npm` instead of `pnpm`
- Missing `VITE_` prefix for frontend variables
- Using `NEXT_PUBLIC_` for backend-only variables
- Copying extra spaces or quotes in `.env.local`

**Quick fix**:
```bash
# Check if environment variables are loaded
echo $DISCORD_BOT_TOKEN
echo $GEMINI_API_KEY

# Restart both servers after changing .env.local
# Terminal 1: Ctrl+C, then pnpm exec next
# Terminal 2: Ctrl+C, then pnpm dev
```

## 🔄 Quick Start Commands Summary

For quick reference, here are the essential commands to run in separate terminals:

**📋 Startup Workflow:**
```
Terminal 1: pnpm exec next     → Starts Next.js API server (port 3000)
Terminal 2: pnpm dev           → Starts Vite frontend (port 5173)
Terminal 3: API call           → Starts Discord bot (REQUIRED!)
```

**Terminal 1 (Discord Bot Server):**
```bash
cd buddy-event-spark
pnpm exec next
```

**Terminal 2 (Frontend):**
```bash
cd buddy-event-spark
pnpm dev
```

**Terminal 3 (Start Bot - after both servers are running):**
```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/bot/start" -Method POST

# Mac/Linux
curl -X POST http://localhost:3000/api/bot/start
```

**🚨 IMPORTANT REMINDER:**
- Running `pnpm exec next` only starts the server
- You MUST make the API call to start the Discord bot
- Without the API call, the bot remains offline
- Both steps are required for the bot to work

**Testing Commands:**
```bash
# Test Discord bot connection
pnpm run test:discord

# Clear and register Discord commands
pnpm run clear:commands

# Or use the direct node commands
node test-discord-setup.js
node clear-commands.js
```

**Database Commands:**
```bash
# Apply database migrations
pnpm run db:migrate

# Reset database (⚠️ WARNING: This will delete all data!)
pnpm run db:reset
```

**Access Points:**
- Frontend: http://localhost:5173
- Dashboard: http://localhost:3000/dashboard
- API: http://localhost:3000/api/*

## 📚 Additional Resources

- **Database Schema**: Check `src/lib/database-schema.sql` for database structure
- **Discord Commands**: See `clear-commands.js` for available slash commands
- **Environment Variables**: Reference `.env.example` for all required variables
- **Package Scripts**: Use `pnpm run` to see available commands