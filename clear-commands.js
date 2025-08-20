import { Client, GatewayIntentBits } from 'discord.js';

// Use your actual values from .env
const DISCORD_BOT_TOKEN = 'MTQwNzM5MDM0NDU4NDIzNzEwNw.GAEFHl.izCtfOEw7sKg5L4m3klyJyX7E_mm8mUz1_9HJs';
const DEV_GUILD_ID = '1407461521566601246';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

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
      {
        name: 'help',
        description: 'Show available commands and usage'
      },
      {
        name: 'input',
        description: 'Send a message to the AI for processing',
        options: [{
          name: 'message',
          description: 'Your message for the AI',
          type: 3, // STRING
          required: true
        }]
      },
      {
        name: 'import_event',
        description: 'Import event data from CSV (Admin only)',
        options: [
          {
            name: 'event_name',
            description: 'Name of the event',
            type: 3, // STRING
            required: true
          },
          {
            name: 'csv_file',
            description: 'CSV file with attendee data',
            type: 11, // ATTACHMENT
            required: true
          }
        ]
      },
      {
        name: 'end_event',
        description: 'End current event and create post-event channel (Admin only)'
      },
      {
        name: 'analytics',
        description: 'Get event analytics (Admin only)',
        options: [{
          name: 'event_name',
          description: 'Specific event to analyze (optional)',
          type: 3, // STRING
          required: false
        }]
      }
    ];

    console.log('📝 Registering new guild commands...');
    await guild.commands.set(commands);
    console.log('✅ New commands registered successfully!');
    
    console.log('\n🎉 Commands reset complete! You can now:');
    console.log('1. Start your Next.js server: pnpm exec next dev -p 3000');
    console.log('2. Go to http://localhost:3000/dashboard');
    console.log('3. Click "Start EventBuddy Bot"');
    console.log('4. Test /help or /input in Discord');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});

client.login(DISCORD_BOT_TOKEN);
