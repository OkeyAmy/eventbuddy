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

### 2. Install Git (if not already installed)
- Go to [git-scm.com](https://git-scm.com/)
- Download and install Git for your operating system
- To verify: `git --version`

### 3. Install a Code Editor (Optional but Recommended)
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
npm install
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

### Step 1: Start the Development Server
```bash
npm run dev
```

You should see output like:
```
  ✓ Ready in 2.1s
  ➜ Local:   http://localhost:3000
  ➜ Network: use --host to expose
```

### Step 2: Test the Web Interface
1. Open your browser to [http://localhost:3000](http://localhost:3000)
2. You should see the EventBuddy landing page
3. Click **"Connect AI to Discord"** to test OAuth flow

### Step 3: Test the Discord Bot (Optional)
1. In your Discord application settings, go to **"OAuth2"** → **"URL Generator"**
2. Select scopes: **bot**, **applications.commands**
3. Select permissions: **Administrator** (for testing)
4. Copy the generated URL and open it in your browser
5. Add the bot to a test Discord server

## 🧪 Testing Your Setup

### Check List:
- [ ] Web app loads at localhost:3000
- [ ] Discord OAuth flow works (redirects properly)
- [ ] Bot appears online in your Discord server
- [ ] Database connection successful (check Supabase dashboard)
- [ ] No error messages in the terminal

### Common Issues & Solutions:

**"Module not found" errors:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

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

## 📝 Development Workflow

1. **Make changes** to your code
2. **Save files** - the dev server will automatically reload
3. **Test changes** in your browser and Discord
4. **Check terminal** for any error messages
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
1. Check the error messages in your terminal - they often point to the exact issue
2. Verify all environment variables are set correctly
3. Ensure all prerequisites are installed properly
4. Review the troubleshooting section above
5. Ask for help in the Lovable Discord community

Remember: Local development is for testing and building new features. Once everything works locally, you can deploy to production with confidence!