import { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  Partials
} from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, Content, FunctionDeclaration} from '@google/generative-ai';

// Types
export interface BotConfig {
  token: string;
  supabaseUrl: string;
  supabaseKey: string;
  geminiApiKey: string;
}

interface EventData {
  id: string;
  name: string;
  attendees: AttendeeData[];
  taggingMode: 'individual' | 'everyone';
  guildId: string;
  channelId?: string;
  postEventChannelId?: string;
  status: 'active' | 'ended' | 'archived';
}

interface AttendeeData {
  name: string;
  email: string;
  discordHandle: string;
  discordId?: string;
  ticketType: string;
  rsvpStatus: string;
}

interface MessageAnalysis {
  intent: 'greeting' | 'question' | 'event_management' | 'server_management' | 'general' | 'spam';
  confidence: number;
  shouldRespond: boolean;
  topic: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  requiredAction?: string;
  parameters?: any;
}

interface AIResponse {
  text: string;
  shouldTag: boolean;
  suggestedTags: string[];
  engagementLevel: 'high' | 'medium' | 'low' | 'spam';
  functionCalls?: Array<{ name: string; args: any }>;
}

interface ConversationHistory {
  role: 'user' | 'model';
  parts: Array<{ text?: string; functionCall?: any; functionResponse?: any }>;
}

export class EventBuddyBot {
  private client: Client;
  private supabase: ReturnType<typeof createClient>;
  private gemini: GoogleGenerativeAI;
  private isReady = false;
  private serverUrl: string;
  private conversationMemory: Map<string, ConversationHistory[]> = new Map();

  // Function declarations for Gemini
  private functionDeclarations: FunctionDeclaration[] = [
    {
      name: 'create_event',
      description: 'Create a new event with specified details',
      parameters: {
        type: 'object',
        properties: {
          eventName: { type: 'string', description: 'Name of the event' },
          eventDate: { type: 'string', description: 'Event date (YYYY-MM-DD)' },
          eventTime: { type: 'string', description: 'Event time (HH:MM)' },
          description: { type: 'string', description: 'Event description' }
        },
        required: ['eventName', 'eventDate', 'eventTime', 'description']
      }
    },
    {
      name: 'end_event',
      description: 'End an active event',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'ID of the event to end' }
        },
        required: []
      }
    },
    {
      name: 'create_channel',
      description: 'Create a new channel for an event',
      parameters: {
        type: 'object',
        properties: {
          channelName: { type: 'string', description: 'Name of the channel' },
          channelType: { type: 'string', enum: ['text', 'voice'], description: 'Type of channel' },
          eventId: { type: 'string', description: 'Associated event ID' },
          isPrivate: { type: 'boolean', description: 'Whether channel is private' }
        },
        required: ['channelName']
      }
    },
    {
      name: 'archive_channel',
      description: 'Archive a channel by adding archived prefix',
      parameters: {
        type: 'object',
        properties: {
          channelId: { type: 'string', description: 'ID of the channel to archive' },
          reason: { type: 'string', description: 'Reason for archiving' }
        },
        required: ['channelId']
      }
    },
    {
      name: 'delete_channel',
      description: 'Delete a channel after confirmation',
      parameters: {
        type: 'object',
        properties: {
          channelId: { type: 'string', description: 'ID of the channel to delete' },
          reason: { type: 'string', description: 'Reason for deletion' }
        },
        required: ['channelId']
      }
    },
    {
      name: 'rename_channel',
      description: 'Rename a channel',
      parameters: {
        type: 'object',
        properties: {
          channelId: { type: 'string', description: 'ID of the channel to rename' },
          newName: { type: 'string', description: 'New name for the channel' },
          reason: { type: 'string', description: 'Reason for renaming' }
        },
        required: ['channelId', 'newName']
      }
    },
    {
      name: 'get_event_analytics',
      description: 'Get analytics for events',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'Specific event ID (optional)' }
        },
        required: []
      }
    }
  ];

  constructor(config: BotConfig) {
    // Determine server URL based on environment
    this.serverUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-render-url.onrender.com' // Replace with your actual Render URL
      : 'http://localhost:8080'; // Frontend runs on 8080

    console.log(`🌐 Server URL set to: ${this.serverUrl}`);

    // Initialize Discord client with necessary intents
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ],
      // Required to receive DM messages
      partials: [Partials.Channel, Partials.Message, Partials.User]
    });

    // Initialize Supabase client
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);

    // Initialize Gemini AI
    this.gemini = new GoogleGenerativeAI(config.geminiApiKey);

    this.setupEventHandlers();
    this.setupCommands();
  }

  private setupEventHandlers() {
    this.client.once('ready', () => {
      console.log(`✅ EventBuddy is online as ${this.client.user?.tag}!`);
      console.log(`🌐 Connected to ${this.client.guilds.cache.size} servers`);
      this.isReady = true;
    });

    this.client.on('interactionCreate', async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          console.log(`🎯 Slash command received: ${interaction.commandName}`);
          await this.handleSlashCommand(interaction);
        } else if (interaction.isButton()) {
          console.log(`🔘 Button interaction: ${interaction.customId}`);
          await this.handleButtonInteraction(interaction);
        }
      } catch (error) {
        console.error('❌ Error handling interaction:', error);
        
        // Only try to reply if it's a repliable interaction and hasn't been replied to
        if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
          try {
            await interaction.reply({ content: '❌ An error occurred while processing your request.', ephemeral: true });
          } catch (replyError) {
            console.error('❌ Failed to send error reply:', replyError);
          }
        }
      }
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      
      console.log(`💬 Message received: "${message.content}" from ${message.author.username}`);
      await this.handleNaturalLanguageMessage(message);
    });

    this.client.on('error', (error) => {
      console.error('❌ Discord client error:', error);
    });
  }

  private async setupCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName('import_event')
        .setDescription('Import event data from CSV (Admin only)')
        .addStringOption(option =>
          option.setName('event_name')
            .setDescription('Name of the event')
            .setRequired(true)
        )
        .addAttachmentOption(option =>
          option.setName('csv_file')
            .setDescription('CSV file with attendee data')
            .setRequired(true)
        ),

      new SlashCommandBuilder()
        .setName('end_event')
        .setDescription('End current event and create post-event channel (Admin only)'),

      new SlashCommandBuilder()
        .setName('analytics')
        .setDescription('Get event analytics (Admin only)')
        .addStringOption(option =>
          option.setName('event_name')
            .setDescription('Specific event to analyze (optional)')
            .setRequired(false)
        ),

      new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show available commands and usage'),

      new SlashCommandBuilder()
        .setName('input')
        .setDescription('Send a message to the AI for processing')
        .addStringOption(option =>
          option.setName('message')
            .setDescription('Your message for the AI')
            .setRequired(true)
        ),

      new SlashCommandBuilder()
        .setName('create_event')
        .setDescription('Create a new event')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Event name')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('date')
            .setDescription('Event date (YYYY-MM-DD)')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('time')
            .setDescription('Event time (HH:MM)')
            .setRequired(false)
        )
    ];

    // TODO - REFACTOR THIS REGISTER ALL GUILDS BEFORE PUSHING TO PROD
    this.client.once('ready', async () => {
      try {
        const payload = commands.map(c => c.toJSON ? c.toJSON() : c);
        const devGuildId = process.env.DEV_GUILD_ID;
        if (devGuildId) {
          const guild = await this.client.guilds.fetch(devGuildId);
          await guild.commands.set(payload);
          console.log(`✅ Registered commands to development guild ${guild.name}`);
        } else {
          await this.client.application?.commands.set(payload);
        }
      } catch (err) {
        console.error('Error registering commands', err);
      }
    });

  }

  private async handleSlashCommand(interaction: ChatInputCommandInteraction) {
    const { commandName } = interaction;

    try {
      // Always acknowledge the interaction first
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: commandName !== 'help' });
      }

      switch (commandName) {
        case 'import_event':
          await this.handleImportEvent(interaction);
          break;
        case 'end_event':
          await this.handleEndEvent(interaction);
          break;
        case 'analytics':
          await this.handleAnalytics(interaction);
          break;
        case 'help':
          await this.handleHelp(interaction);
          break;
        case 'input':
          await this.handleInputCommand(interaction);
          break;
        case 'create_event':
          await this.handleCreateEvent(interaction);
          break;
        default:
          await this.editOrReply(interaction, '❌ Unknown command!');
      }
    } catch (error) {
      console.error(`❌ Error handling command ${commandName}:`, error);
      await this.editOrReply(interaction, '❌ An error occurred while processing your command.');
    }
  }

  private async handleNaturalLanguageMessage(message: Message) {
    try {
      // Skip if message is too short or empty
      if (!message.content || message.content.length < 2) return;

      console.log(`💬 Processing message: "${message.content}" from ${message.author.username} in ${message.guild?.name || 'DM'}`);

      // Get conversation history for context
      const conversationKey = `${message.channelId}_${message.author.id}`;
      let history = this.conversationMemory.get(conversationKey) || [];

      // Analyze the message with AI using function calling
      const model = this.gemini.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        tools: [{ functionDeclarations: this.functionDeclarations }]
      });

      // Build conversation context
      const systemPrompt = `You are EventBuddy, a friendly Discord bot that helps manage events and servers. 

You can:
- Create and manage events
- Create, archive, delete, and rename channels
- Provide analytics and insights
- Engage in natural conversation

Current user: @${message.author.username}
Channel: ${message.channelId}
Guild: ${message.guildId}

Context: This is a Discord server where you help with event management. Always be helpful and friendly.`;

      // Add user message to history
      history.push({
        role: 'user',
        parts: [{ text: message.content }]
      });

      // Keep only last 10 exchanges to manage token limits
      if (history.length > 20) {
        history = history.slice(-20);
      }

      const contents: Content[] = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...history
      ];

      console.log(`🧠 Generating AI response with ${this.functionDeclarations.length} available functions`);

      // Generate response with function calling
      let result = await model.generateContent({ contents });
      let response = result.response;

      // Handle function calls if present
      if (response.functionCalls && response.functionCalls.length > 0) {
        console.log(`🔧 Executing ${response.functionCalls.length} function calls`);
        
        // Add model response to history
        history.push({
          role: 'model',
          parts: [{ functionCall: response.functionCalls[0] }]
        });

        // Execute each function call
        for (const functionCall of response.functionCalls) {
          console.log(`🔧 Calling function: ${functionCall.name}`, functionCall.args);
          
          try {
            const functionResult = await this.executeFunctionCall(functionCall.name, functionCall.args, message);
            
            // Add function response to history
            history.push({
              role: 'user',
              parts: [{
                functionResponse: {
                  name: functionCall.name,
                  response: { result: functionResult }
                }
              }]
            });
          } catch (error) {
            console.error(`❌ Error executing function ${functionCall.name}:`, error);
            
            // Add error response to history
            history.push({
              role: 'user',
              parts: [{
                functionResponse: {
                  name: functionCall.name,
                  response: { error: error.message }
                }
              }]
            });
          }
        }

        // Generate final response incorporating function results
        const finalContents: Content[] = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...history
        ];

        result = await model.generateContent({ contents: finalContents });
        response = result.response;
      }

      // Send the text response
      const responseText = response.text();
      if (responseText && responseText.trim()) {
        console.log(`📤 Sending response: "${responseText.substring(0, 100)}..."`);
        
        // Add AI response to history
        history.push({
          role: 'model',
          parts: [{ text: responseText }]
        });

        // Update conversation memory
        this.conversationMemory.set(conversationKey, history);

        await message.reply(responseText);
      }

      // Store conversation for analytics
      await this.storeConversation(message, { 
        intent: 'general', 
        confidence: 0.9, 
        shouldRespond: true, 
        topic: 'ai_conversation',
        sentiment: 'neutral'
      });

    } catch (error) {
      console.error('❌ Error handling natural language message:', error);
      // Send a friendly error message to the user
      try {
        await message.reply('❌ Sorry, I encountered an error while processing your message. Please try again!');
      } catch (replyError) {
        console.error('❌ Failed to send error message:', replyError);
      }
    }
  }

  private async executeFunctionCall(functionName: string, args: any, message: Message): Promise<any> {
    switch (functionName) {
      case 'create_event':
        return await this.createEvent(message, args);
      case 'end_event':
        return await this.endEvent(message, args);
      case 'create_channel':
        return await this.createEventChannel(message, args);
      case 'archive_channel':
        return await this.archiveChannel(message, args);
      case 'delete_channel':
        return await this.deleteChannel(message, args);
      case 'rename_channel':
        return await this.renameChannel(message, args);
      case 'get_event_analytics':
        return await this.getEventAnalytics(message, args);
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }

  private async handleButtonInteraction(interaction: any) {
    const [action, functionName, messageId] = interaction.customId.split('_');
    
    if (action === 'confirm') {
      // Check if user has admin permissions
      const hasPermission = await this.checkAdminPermission(interaction.user.id, interaction.guildId);
      
      if (!hasPermission) {
        await interaction.reply({ 
          content: '❌ You need admin permissions to perform this action.', 
          ephemeral: true 
        });
        return;
      }

      // Execute the function
      await interaction.reply({ 
        content: `⚡ Executing ${functionName}...`, 
        ephemeral: true 
      });
      
      // TODO: Implement actual function execution
      await this.executeFunctionCallFromInteraction(functionName, {}, interaction);
      
    } else if (action === 'cancel') {
      await interaction.reply({ 
        content: '❌ Action cancelled.', 
        ephemeral: true 
      });
    }

    // Remove the buttons
    await interaction.message.edit({ components: [] });
  }

  private async executeFunctionCallFromInteraction(functionName: string, parameters: any, interaction: any) {
    try {
      switch (functionName) {
        case 'create_event':
          await this.handleCreateEvent(interaction);
          break;
        case 'end_event':
          await this.handleEndEvent(interaction);
          break;
        default:
          await interaction.followUp({ 
            content: `❌ Unknown function: ${functionName}`, 
            ephemeral: true 
          });
      }
    } catch (error) {
      console.error(`❌ Error executing function ${functionName}:`, error);
      await interaction.followUp({ 
        content: `❌ Error executing ${functionName}`, 
        ephemeral: true 
      });
    }
  }

  private async checkAdminPermission(userId: string, guildId: string): Promise<boolean> {
    try {
      // Check if user is event host or has admin role
      const { data: eventHost } = await this.supabase
        .from('events')
        .select('host_discord_id')
        .eq('guild_id', guildId)
        .eq('host_discord_id', userId)
        .eq('status', 'active')
        .single();

      return !!eventHost;
    } catch (error) {
      console.error('❌ Error checking admin permission:', error);
      return false;
    }
  }

  private async editOrReply(interaction: ChatInputCommandInteraction, content: string) {
    try {
      if (interaction.deferred) {
        await interaction.editReply(content);
      } else if (!interaction.replied) {
        await interaction.reply({ content, ephemeral: true });
      }
    } catch (error) {
      console.error('❌ Error sending interaction response:', error);
    }
  }

  private async handleImportEvent(interaction: ChatInputCommandInteraction) {
    const eventName = interaction.options.getString('event_name')!;
    const csvFile = interaction.options.getAttachment('csv_file')!;

    if (!csvFile.url.endsWith('.csv')) {
      return this.editOrReply(interaction, '❌ Please upload a valid CSV file!');
    }

    try {
      // Store basic event info
      const { data: eventData, error } = await this.supabase
        .from('events')
        .insert({
          event_name: eventName,
          host_discord_id: interaction.user.id,
          guild_id: interaction.guildId,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Event Created Successfully!')
        .addFields(
          { name: '📊 Event Name', value: eventName, inline: true },
          { name: '👑 Host', value: `<@${interaction.user.id}>`, inline: true },
          { name: '📅 Status', value: 'Active', inline: true }
        )
        .setColor(0x00ff00);

      await this.editOrReply(interaction, '');
      await interaction.followUp({ embeds: [successEmbed], ephemeral: true });

    } catch (error) {
      console.error('❌ Error importing event:', error);
      await this.editOrReply(interaction, '❌ Error creating event. Please try again.');
    }
  }

  private async handleCreateEvent(interaction: ChatInputCommandInteraction) {
    const eventName = interaction.options.getString('name')!;
    const eventDate = interaction.options.getString('date');
    const eventTime = interaction.options.getString('time');

    try {
      const { data: eventData, error } = await this.supabase
        .from('events')
        .insert({
          event_name: eventName,
          event_date: eventDate,
          event_time: eventTime,
          host_discord_id: interaction.user.id,
          guild_id: interaction.guildId,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      await this.editOrReply(interaction, `✅ Event "${eventName}" created successfully!`);
    } catch (error) {
      console.error('❌ Error creating event:', error);
      await this.editOrReply(interaction, '❌ Error creating event. Please try again.');
    }
  }

  private async handleEndEvent(interaction: ChatInputCommandInteraction) {
    try {
      const { data: activeEvent } = await this.supabase
        .from('events')
        .select('*')
        .eq('host_discord_id', interaction.user.id)
        .eq('guild_id', interaction.guildId)
        .eq('status', 'active')
        .single();

      if (!activeEvent) {
        return this.editOrReply(interaction, '❌ No active event found!');
      }

      await this.supabase
        .from('events')
        .update({ status: 'ended' })
        .eq('id', activeEvent.id);

      await this.editOrReply(interaction, `✅ Event "${activeEvent.event_name}" ended successfully!`);
    } catch (error) {
      console.error('❌ Error ending event:', error);
      await this.editOrReply(interaction, '❌ Error ending event. Please try again.');
    }
  }

  private async handleAnalytics(interaction: ChatInputCommandInteraction) {
    try {
      const { data: events } = await this.supabase
        .from('events')
        .select('*')
        .eq('host_discord_id', interaction.user.id)
        .eq('guild_id', interaction.guildId);

      const analyticsEmbed = new EmbedBuilder()
        .setTitle('📊 Event Analytics')
        .addFields(
          { name: '🎯 Total Events', value: (events?.length || 0).toString(), inline: true },
          { name: '⚡ Active Events', value: (events?.filter(e => e.status === 'active').length || 0).toString(), inline: true },
          { name: '✅ Completed Events', value: (events?.filter(e => e.status === 'ended').length || 0).toString(), inline: true }
        )
        .setColor(0x5865F2);

      await this.editOrReply(interaction, '');
      await interaction.followUp({ embeds: [analyticsEmbed], ephemeral: true });
    } catch (error) {
      console.error('❌ Error generating analytics:', error);
      await this.editOrReply(interaction, '❌ Error generating analytics.');
    }
  }

  private async handleHelp(interaction: ChatInputCommandInteraction) {
    const helpEmbed = new EmbedBuilder()
      .setTitle('🤖 EventBuddy Commands')
      .setDescription('AI-powered Discord event management with natural language support')
      .addFields(
        { 
          name: '🎯 Event Commands', 
          value: '`/create_event` - Create a new event\n`/end_event` - End current event\n`/analytics` - View event metrics',
          inline: false 
        },
        { 
          name: '💬 AI Chat', 
          value: '`/input <message>` - Chat with AI\n**Or just type naturally!** I understand:\n• "Hello" - Greetings\n• "Create an event for tomorrow" - Event management\n• "Make a channel for discussion" - Channel management',
          inline: false 
        },
        {
          name: '✨ Natural Language Examples',
          value: '• "Create a channel called meeting-room"\n• "Archive the old-discussion channel"\n• "Show me event analytics"\n• "End the current event"',
          inline: false
        }
      )
      .setColor(0x5865F2);

    await this.editOrReply(interaction, '');
    await interaction.followUp({ embeds: [helpEmbed] });
  }

  private async handleInputCommand(interaction: ChatInputCommandInteraction) {
    const userMessage = interaction.options.getString('message')!;
    
    try {
      const response = await this.generateAIResponse(userMessage, {
        author: interaction.user,
        channelId: interaction.channelId,
        isSlashCommand: true
      });

      await this.editOrReply(interaction, response.text || 'I understand, but I\'m not sure how to respond to that.');

    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      await this.editOrReply(interaction, '❌ Sorry, I encountered an error processing your message.');
    }
  }

  private async generateAIResponse(message: string, context: any): Promise<AIResponse> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent(`You are EventBuddy, respond helpfully to: "${message}"`);
    const response = await result.response;
    
    return {
      text: response.text(),
      shouldTag: false,
      suggestedTags: [],
      engagementLevel: 'medium'
    };
  }

  // Channel management functions
  private async createEvent(message: Message, args: any) {
    const { eventName, eventDate, eventTime, description } = args;
    
    try {
      const { data: eventData, error } = await this.supabase
        .from('events')
        .insert({
          event_name: eventName,
          event_date: eventDate,
          event_time: eventTime,
          description: description,
          host_discord_id: message.author.id,
          guild_id: message.guildId,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      return `Event "${eventName}" created successfully! Event ID: ${eventData.id}`;
    } catch (error) {
      console.error('❌ Error creating event:', error);
      throw error;
    }
  }

  private async endEvent(message: Message, args: any) {
    try {
      const { data: activeEvent } = await this.supabase
        .from('events')
        .select('*')
        .eq('host_discord_id', message.author.id)
        .eq('guild_id', message.guildId)
        .eq('status', 'active')
        .single();

      if (!activeEvent) {
        throw new Error('No active event found');
      }

      await this.supabase
        .from('events')
        .update({ status: 'ended' })
        .eq('id', activeEvent.id);

      return `Event "${activeEvent.event_name}" ended successfully!`;
    } catch (error) {
      console.error('❌ Error ending event:', error);
      throw error;
    }
  }

  private async getEventAnalytics(message: Message, args: any) {
    try {
      const { data: events } = await this.supabase
        .from('events')
        .select('*')
        .eq('host_discord_id', message.author.id)
        .eq('guild_id', message.guildId);

      const analytics = {
        totalEvents: events?.length || 0,
        activeEvents: events?.filter(e => e.status === 'active').length || 0,
        completedEvents: events?.filter(e => e.status === 'ended').length || 0
      };

      return `Event Analytics: ${analytics.totalEvents} total events, ${analytics.activeEvents} active, ${analytics.completedEvents} completed.`;
    } catch (error) {
      console.error('❌ Error generating analytics:', error);
      throw error;
    }
  }

  private async createEventChannel(message: Message, args: any) {
    const { channelName, eventId, channelType = 'text', isPrivate = false } = args;
    
    if (!message.guild) {
      throw new Error('This command can only be used in a server!');
    }

    try {
      const channel = await message.guild.channels.create({
        name: channelName,
        type: channelType === 'voice' ? 2 : 0, // 0 = text, 2 = voice
        parent: null, // You can set a category ID here
        reason: `Event channel created for event ${eventId || 'general'}`
      });
      
      // Send welcome message to the new channel
      if (channel.type === 0) { // text channel
        const textChannel = channel as any;
        await textChannel.send(`🎉 Welcome to ${channelName}! This channel was created for event management. I'll be here to help with any questions!`);
        
        // Set up auto-engagement for this channel
        this.setupChannelEngagement(textChannel.id, eventId || 'general');
      }

      // Store channel info in database
      await this.storeEventChannel(eventId || 'general', channel.id, channelName, channelType);

      return `Channel "${channelName}" created successfully!`;
    } catch (error) {
      console.error('❌ Error creating channel:', error);
      throw error;
    }
  }

  private async archiveChannel(message: Message, args: any) {
    const { channelId, reason = 'Channel archived' } = args;
    
    if (!message.guild) {
      throw new Error('This command can only be used in a server!');
    }

    try {
      const channel = message.guild.channels.cache.get(channelId) || message.channel;
      if (!channel) {
        throw new Error('Channel not found!');
      }

      // Move to archived category or add archived prefix
      await (channel as any).setName(`archived-${channel.name}`, reason);
      return 'Channel archived successfully!';
    } catch (error) {
      console.error('❌ Error archiving channel:', error);
      throw error;
    }
  }

  private async deleteChannel(message: Message, args: any) {
    const { channelId, reason = 'Channel deleted' } = args;
    
    if (!message.guild) {
      throw new Error('This command can only be used in a server!');
    }

    try {
      const channel = message.guild.channels.cache.get(channelId) || message.channel;
      if (!channel) {
        throw new Error('Channel not found!');
      }

      // For safety, we'll just archive instead of delete for now
      await (channel as any).setName(`deleted-${channel.name}`, reason);
      return 'Channel marked for deletion (archived for safety)!';
    } catch (error) {
      console.error('❌ Error deleting channel:', error);
      throw error;
    }
  }

  private async renameChannel(message: Message, args: any) {
    const { channelId, newName, reason = 'Channel renamed' } = args;
    
    if (!message.guild) {
      throw new Error('This command can only be used in a server!');
    }

    try {
      const channel = message.guild.channels.cache.get(channelId) || message.channel;
      if (!channel) {
        throw new Error('Channel not found!');
      }

      const oldName = channel.name;
      await (channel as any).setName(newName, reason);
      return `Channel renamed from "${oldName}" to "${newName}"!`;
    } catch (error) {
      console.error('❌ Error renaming channel:', error);
      throw error;
    }
  }

  private async checkEventHostPermission(userId: string, eventId?: string): Promise<boolean> {
    // If no eventId, check if user has admin permissions
    if (!eventId) {
      return true; // For now, allow all users
    }

    try {
      const { data: event } = await this.supabase
        .from('events')
        .select('host_discord_id')
        .eq('id', eventId)
        .single();

      return event?.host_discord_id === userId;
    } catch (error) {
      console.error('Error checking event host permission:', error);
      return false;
    }
  }

  private setupChannelEngagement(channelId: string, eventId: string) {
    // Set up periodic engagement messages for the channel
    const engagementInterval = setInterval(async () => {
      try {
        const channel = this.client.channels.cache.get(channelId) as any;
        if (!channel || channel.deleted) {
          clearInterval(engagementInterval);
          return;
        }

        // Send engagement message occasionally (every 30 minutes of no activity)
        const messages = await channel.messages.fetch({ limit: 1 });
        const lastMessage = messages.first();
        
        if (!lastMessage || (Date.now() - lastMessage.createdTimestamp) > 1800000) { // 30 minutes
          const engagementMessages = [
            "👋 How's everyone doing? Any questions about the event?",
            "💡 Feel free to share your thoughts or ask any questions!",
            "🎯 Don't forget to check out the event details!",
            "🤝 Great to see everyone engaged! Keep the conversation going!"
          ];
          
          const randomMessage = engagementMessages[Math.floor(Math.random() * engagementMessages.length)];
          await channel.send(randomMessage);
        }
      } catch (error) {
        console.error('Error in channel engagement:', error);
        clearInterval(engagementInterval);
      }
    }, 900000); // Check every 15 minutes
  }

  private async storeEventChannel(eventId: string, channelId: string, channelName: string, channelType: string) {
    try {
      // Store channel info in conversations table for analytics
      await this.supabase.from('conversations').insert({
        channel_id: channelId,
        event_id: eventId,
        discord_user_id: 'system',
        discord_message_id: 'channel_created',
        message_content: `Channel "${channelName}" created (type: ${channelType})`,
        ai_analysis: { action: 'channel_created', channel_type: channelType }
      });
    } catch (error) {
      console.error('Error storing event channel:', error);
    }
  }

  private async storeConversation(message: Message, analysis?: MessageAnalysis): Promise<void> {
    try {
      await this.supabase.from('conversations').insert({
        channel_id: message.channelId,
        discord_message_id: message.id,
        discord_user_id: message.author.id,
        message_content: message.content,
        engagement_level: analysis?.intent || 'general',
        sentiment_score: analysis?.confidence || 0.5,
        ai_analysis: analysis || {}
      });
    } catch (error) {
      console.error('❌ Error storing conversation:', error);
    }
  }

  public async start(token: string): Promise<void> {
    console.log('🚀 Starting EventBuddy bot...');
    
    // Add better error handling for login
    try {
      await this.client.login(token);
      console.log('✅ Bot login successful');
    } catch (error) {
      console.error('❌ Bot login failed:', error);
      
      if (error.message?.includes('disallowed intents')) {
        console.error(`
🔧 FIX REQUIRED: Enable the following intents in Discord Developer Portal:
1. Go to https://discord.com/developers/applications
2. Select your bot application
3. Go to "Bot" section
4. Enable these Privileged Gateway Intents:
   ✅ MESSAGE CONTENT INTENT (Critical!)
   ✅ SERVER MEMBERS INTENT
   ✅ PRESENCE INTENT (Optional)
5. Save changes and restart bot

Current issue: Your bot doesn't have permission to read message content.
        `);
      }
      
      throw error;
    }
  }

  public async stop(): Promise<void> {
    this.client.destroy();
    console.log('🛑 EventBuddy bot stopped.');
  }
}
