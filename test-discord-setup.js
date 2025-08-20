import { Client, GatewayIntentBits } from 'discord.js';

// Test the Discord bot setup with the new configuration
const DISCORD_BOT_TOKEN = 'MTQwNzM5MDM0NDU4NDIzNzEwNw.GAEFHl.izCtfOEw7sKg5L4m3klyJyX7E_mm8mUz1_9HJs';

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
  console.log('1. Start your local server: pnpm dev');
  console.log('2. Go to http://localhost:5173/dashboard');
  console.log('3. Click "Start EventBuddy Bot"');
  console.log('4. Test the new slash commands in Discord');
  
  process.exit(0);
});

client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
  process.exit(1);
});

console.log('🔌 Testing Discord bot connection...');
client.login(DISCORD_BOT_TOKEN);