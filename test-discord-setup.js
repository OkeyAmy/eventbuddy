import { config as loadEnv } from 'dotenv';
// Prefer .env.local, then fallback to .env
loadEnv({ path: '.env.local', override: true });
loadEnv();

import { Client, GatewayIntentBits } from 'discord.js';

// Test the Discord bot setup with environment configuration
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

if (!DISCORD_BOT_TOKEN || DISCORD_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error('❌ Missing DISCORD_BOT_TOKEN. Set it in .env.local or .env, or export it in your shell.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', () => {
  console.log(`✅ Test successful! Bot connected as ${client.user.tag}`);
  console.log(`📊 Bot is in ${client.guilds.cache.size} servers`);
  console.log('🎯 EventBuddy Discord bot is ready for use!');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Start your local servers (Next API + Vite)');
  console.log('2. POST to http://localhost:3000/api/bot/start to start the bot');
  console.log('3. Test the slash commands in Discord');
  
  process.exit(0);
});

client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
  process.exit(1);
});

console.log('🔌 Testing Discord bot connection...');
client.login(DISCORD_BOT_TOKEN);