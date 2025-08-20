import { config as loadEnv } from 'dotenv';
// Prefer .env.local, then fallback to .env
loadEnv({ path: '.env.local', override: true });
loadEnv();

import { Client, GatewayIntentBits } from 'discord.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const DEV_GUILD_ID = process.env.DEV_GUILD_ID || 'YOUR_DEV_GUILD_ID_HERE';

if (!DISCORD_BOT_TOKEN || DISCORD_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error('❌ Missing DISCORD_BOT_TOKEN. Set it in .env.local or .env, or export it in your shell.');
  process.exit(1);
}

if (!DEV_GUILD_ID || DEV_GUILD_ID === 'YOUR_DEV_GUILD_ID_HERE') {
  console.error('❌ Missing DEV_GUILD_ID. Set it in .env.local or .env, or export it in your shell.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  
  try {
    // Clear ALL global commands first
    console.log('🧹 Clearing global commands...');
    await client.application.commands.set([]);
    console.log('✅ Global commands cleared');

    // Clear guild commands
    console.log('🧹 Clearing guild commands...');
    const guild = await client.guilds.fetch(DEV_GUILD_ID);
    await guild.commands.set([]);
    console.log('✅ Guild commands cleared');

    // Now register your new commands
    const commands = [
      { name: 'help', description: 'Show available commands and usage' },
      {
        name: 'input',
        description: 'Send a message to the AI for processing',
        options: [{ name: 'message', description: 'Your message for the AI', type: 3, required: true }]
      },
      {
        name: 'import_event',
        description: 'Import event data from CSV (Admin only)',
        options: [
          { name: 'event_name', description: 'Name of the event', type: 3, required: true },
          { name: 'csv_file', description: 'CSV file with attendee data', type: 11, required: true }
        ]
      },
      { name: 'end_event', description: 'End current event and create post-event channel (Admin only)' },
      {
        name: 'analytics',
        description: 'Get event analytics (Admin only)',
        options: [{ name: 'event_name', description: 'Specific event to analyze (optional)', type: 3, required: false }]
      }
    ];

    console.log('📝 Registering new guild commands...');
    const guild = await client.guilds.fetch(DEV_GUILD_ID);
    await guild.commands.set(commands);
    console.log('✅ New commands registered successfully!');

    console.log('\n🎉 Commands reset complete! You can now:');
    console.log('1. Start your Next API server and Vite frontend');
    console.log('2. POST to http://localhost:3000/api/bot/start to start the bot');
    console.log('3. Test /help or /input in Discord');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});

client.login(DISCORD_BOT_TOKEN);
