import { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  Message,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  Partials
} from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  functionCalls?: FunctionCall[];
}

interface FunctionCall {
  name: string;
  arguments: any;
}

export class EventBuddyBot {
  private client: Client;
  private supabase: ReturnType<typeof createClient>;
  private gemini: GoogleGenerativeAI;
  private isReady = false;
  private serverUrl: string;

  // Robust JSON extractor to tolerate code fences and partial JSON blocks
  private extractJson<T = any>(raw: string): T {
    // Fast path
    try {
      return JSON.parse(raw) as T;
    } catch {}

    // Strip Markdown code fences like ```json ... ```
    const unfenced = raw
      .replace(/^```(?:json|JSON)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    try {
      return JSON.parse(unfenced) as T;
    } catch {}

    // Extract the first balanced JSON object
    const start = unfenced.indexOf('{');
    if (start !== -1) {
      let depth = 0;
      for (let i = start; i < unfenced.length; i++) {
        const ch = unfenced[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            const candidate = unfenced.slice(start, i + 1);
            try {
              return JSON.parse(candidate) as T;
            } catch {}
            break;
          }
        }
      }
    }

    // As a last resort, return a minimal default
    return { } as T;
  }

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

    this.client.once('ready', async () => {
      try {
        const devGuildId = process.env.DEV_GUILD_ID;
        if (devGuildId) {
          console.log(`🔄 Registering GUILD commands for ${devGuildId}`);
          const guild = await this.client.guilds.fetch(devGuildId);
          await guild.commands.set(commands);
          console.log('✅ Guild slash commands registered successfully!');
        } else {
          console.log('🔄 Registering GLOBAL commands');
          await this.client.application?.commands.set(commands);
          console.log('✅ Global slash commands registered successfully!');
        }
      } catch (error) {
        console.error('❌ Error registering commands:', error);
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

      // Analyze the message with AI
      const analysis = await this.analyzeMessageIntent(message.content, {
        author: message.author,
        channelId: message.channelId,
        guildId: message.guildId
      });

      console.log(`🧠 Message analysis:`, {
        intent: analysis.intent,
        confidence: analysis.confidence,
        shouldRespond: analysis.shouldRespond,
        topic: analysis.topic
      });

      // Only respond if confidence is high enough and should respond
      if (analysis.shouldRespond && analysis.confidence > 0.6) {
        console.log(`✅ Responding to message with ${analysis.confidence} confidence`);
        
        // Generate AI response with function calling
        const response = await this.generateSmartResponse(message, analysis);
        
        if (response) {
          // Handle function calls first
          if (response.functionCalls && response.functionCalls.length > 0) {
            console.log(`🔧 Executing ${response.functionCalls.length} function calls`);
            await this.handleFunctionCalls(message, response.functionCalls);
          }

          // Send the text response
          if (response.text && response.text.trim()) {
            console.log(`📤 Sending response: "${response.text.substring(0, 100)}..."`);
            await message.reply(response.text);
          }
        }
      } else {
        console.log(`⏭️ Skipping response (confidence: ${analysis.confidence}, shouldRespond: ${analysis.shouldRespond})`);
      }

      // Store conversation for analytics
      await this.storeConversation(message, analysis);

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

  private async analyzeMessageIntent(content: string, context: any): Promise<MessageAnalysis> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `Analyze this Discord message for intent and determine if EventBuddy should respond:

Message: "${content}"
Context: Channel ID ${context.channelId}, Guild ID ${context.guildId}

Classify the intent as one of:
- greeting: Hello, hi, good morning, etc.
- question: Questions about events, the bot, or general inquiries
- event_management: Creating, ending, managing events
- server_management: Creating channels, managing roles, server settings
- general: General conversation, casual chat
- spam: Very short, irrelevant, or spam content

Consider these factors:
- EventBuddy should respond to greetings warmly
- Always respond to questions
- Event/server management requires admin confirmation
- Engage in relevant general conversation
- Ignore obvious spam or very short messages

Return JSON with this exact structure:
{
  "intent": "greeting|question|event_management|server_management|general|spam",
  "confidence": 0.0-1.0,
  "shouldRespond": true|false,
  "topic": "brief topic description",
  "sentiment": "positive|neutral|negative",
  "requiredAction": "optional action needed",
  "parameters": {}
}`;

    try {
      const generationConfig: any = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            intent: { type: 'string', enum: ['greeting','question','event_management','server_management','general','spam'] },
            confidence: { type: 'number' },
            shouldRespond: { type: 'boolean' },
            topic: { type: 'string' },
            sentiment: { type: 'string', enum: ['positive','neutral','negative'] }
          },
          required: ['intent','confidence','shouldRespond','topic','sentiment']
        }
      };

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig
      });
      const response = await result.response;
      const analysis = this.extractJson<MessageAnalysis>(response.text());
      
      // Ensure confidence is reasonable
      if (analysis.confidence > 0.95) analysis.confidence = 0.9;
      if (analysis.confidence < 0.1) analysis.confidence = 0.1;
      
      return analysis;
    } catch (error) {
      console.error('❌ Error analyzing message intent:', error);
      return {
        intent: 'general',
        confidence: 0.5,
        shouldRespond: true,
        topic: 'general conversation',
        sentiment: 'neutral'
      };
    }
  }

  private async generateSmartResponse(message: Message, analysis: MessageAnalysis): Promise<AIResponse | null> {
		try {
			const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
			
			const prompt = `You are EventBuddy, a friendly AI Discord bot that helps manage events and servers.

User message: "${message.content}"
Intent: ${analysis.intent}
Topic: ${analysis.topic}
Author: @${message.author.username}

Return STRICT JSON with this schema:
{
  "text": "natural helpful reply",
  "functionCalls": [
    { "name": "create_event|end_event|get_event_analytics|manage_server|create_channel|archive_channel|delete_channel|rename_channel", "arguments": { } }
  ]
}
If no function call is appropriate, return an empty array for "functionCalls". Do not include any additional text outside of JSON. Keep "text" concise (1-2 sentences).`;

			const generationConfig: any = {
				responseMimeType: 'application/json',
				responseSchema: {
					type: 'object',
					properties: {
						text: { type: 'string' },
						functionCalls: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									name: { type: 'string' },
									arguments: { 
										type: 'object',
										properties: {},
										required: []
									}
								},
								required: ['name','arguments']
							}
						}
					},
					required: ['text','functionCalls']
				}
			};

			const result = await model.generateContent({
				contents: [{ role: 'user', parts: [{ text: prompt }] }],
				generationConfig
			});
			const response = await result.response;
			const raw = response.text().trim();
			const parsed = this.extractJson<{ text?: string; functionCalls?: Array<{ name: string; arguments: any }> }>(raw);

			return {
				text: (parsed && parsed.text) ? parsed.text : raw,
				shouldTag: false,
				suggestedTags: [],
				engagementLevel: analysis.confidence > 0.8 ? 'high' : 'medium',
				functionCalls: Array.isArray(parsed?.functionCalls) ? parsed.functionCalls : []
			};
		} catch (error) {
			console.error('❌ Error generating response:', error);
			return null;
		}
  }


  private async handleFunctionCalls(message: Message, functionCalls: FunctionCall[]) {
    for (const call of functionCalls) {
      try {
        console.log(`🔧 Executing function: ${call.name}`, call.arguments);
        
        switch (call.name) {
          case 'create_event':
            await this.createEvent(message, call.arguments);
            break;
          case 'end_event':
            await this.endEvent(message, call.arguments);
            break;
          case 'get_event_analytics':
            await this.getEventAnalytics(message, call.arguments);
            break;
          case 'manage_server':
            await this.manageServer(message, call.arguments);
            break;
          case 'create_channel':
            await this.createEventChannel(message, call.arguments);
            break;
          case 'archive_channel':
            await this.archiveChannel(message, call.arguments);
            break;
          case 'delete_channel':
            await this.deleteChannel(message, call.arguments);
            break;
          case 'rename_channel':
            await this.renameChannel(message, call.arguments);
            break;
          default:
            console.log(`⚠️ Unknown function: ${call.name}`);
        }
      } catch (error) {
        console.error(`❌ Error executing function ${call.name}:`, error);
        await message.reply(`❌ Error executing ${call.name}: ${error.message}`);
      }
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
      await this.executeFunctionCall(functionName, {}, interaction);
      
    } else if (action === 'cancel') {
      await interaction.reply({ 
        content: '❌ Action cancelled.', 
        ephemeral: true 
      });
    }

    // Remove the buttons
    await interaction.message.edit({ components: [] });
  }

  private async executeFunctionCall(functionName: string, parameters: any, interaction: any) {
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
      .setDescription('AI-powered Discord event management')
      .addFields(
        { 
          name: '🎯 Event Commands', 
          value: '`/create_event` - Create a new event\n`/end_event` - End current event\n`/analytics` - View event metrics',
          inline: false 
        },
        { 
          name: '💬 AI Chat', 
          value: '`/input <message>` - Chat with AI\n**Or just type naturally!** I understand:\n• "Hello" - Greetings\n• "Create an event" - Event management\n• "How do I..." - Questions',
          inline: false 
        },
        {
          name: '✨ Natural Language',
          value: 'You can chat with me naturally! No need for slash commands for basic conversations.',
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
    const { eventName, eventDate, eventTime } = args;
    
    try {
      const { data: eventData, error } = await this.supabase
        .from('events')
        .insert({
          event_name: eventName,
          event_date: eventDate,
          event_time: eventTime,
          host_discord_id: message.author.id,
          guild_id: message.guildId,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      await message.reply(`✅ Event "${eventName}" created successfully!`);
    } catch (error) {
      console.error('❌ Error creating event:', error);
      await message.reply('❌ Error creating event. Please try again.');
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
        await message.reply('❌ No active event found!');
        return;
      }

      await this.supabase
        .from('events')
        .update({ status: 'ended' })
        .eq('id', activeEvent.id);

      await message.reply(`✅ Event "${activeEvent.event_name}" ended successfully!`);
    } catch (error) {
      console.error('❌ Error ending event:', error);
      await message.reply('❌ Error ending event. Please try again.');
    }
  }

  private async getEventAnalytics(message: Message, args: any) {
    try {
      const { data: events } = await this.supabase
        .from('events')
        .select('*')
        .eq('host_discord_id', message.author.id)
        .eq('guild_id', message.guildId);

      const analyticsEmbed = new EmbedBuilder()
        .setTitle('📊 Event Analytics')
        .addFields(
          { name: '🎯 Total Events', value: (events?.length || 0).toString(), inline: true },
          { name: '⚡ Active Events', value: (events?.filter(e => e.status === 'active').length || 0).toString(), inline: true },
          { name: '✅ Completed Events', value: (events?.filter(e => e.status === 'ended').length || 0).toString(), inline: true }
        )
        .setColor(0x5865F2);

      await message.reply({ embeds: [analyticsEmbed] });
    } catch (error) {
      console.error('❌ Error generating analytics:', error);
      await message.reply('❌ Error generating analytics.');
    }
  }

  private async manageServer(message: Message, args: any) {
    // Implementation for server management
    console.log('🏢 Managing server:', args);
    await message.reply('🏢 Server management functionality coming soon!');
  }

  private async createEventChannel(message: Message, args: any) {
    const { channelName, eventId, channelType = 'text', private: isPrivate = false } = args;
    
    if (!message.guild) {
      await message.reply('❌ This command can only be used in a server!');
      return;
    }

    try {
      // Check if user has permission or is event host
      const hasPermission = await this.checkEventHostPermission(message.author.id, eventId);
      if (!hasPermission) {
        await message.reply('⚠️ You need to be the event host to create channels for this event.');
        return;
      }

      const channel = await message.guild.channels.create({
        name: channelName,
        type: channelType === 'voice' ? 2 : 0, // 0 = text, 2 = voice
        parent: null, // You can set a category ID here
        reason: `Event channel created for event ${eventId}`
      });

      await message.reply(`✅ Channel ${channel} created successfully!`);
      
      // Send welcome message to the new channel
      if (channel.type === 0) { // text channel
        const textChannel = channel as any;
        await textChannel.send(`🎉 Welcome to ${channelName}! This channel was created for event management. I'll be here to help with any questions!`);
        
        // Set up auto-engagement for this channel
        this.setupChannelEngagement(textChannel.id, eventId);
      }

      // Store channel info in database
      await this.storeEventChannel(eventId, channel.id, channelName, channelType);

    } catch (error) {
      console.error('❌ Error creating channel:', error);
      await message.reply('❌ Failed to create channel. Make sure I have the necessary permissions!');
    }
  }

  private async archiveChannel(message: Message, args: any) {
    const { channelId, reason = 'Channel archived' } = args;
    
    if (!message.guild) {
      await message.reply('❌ This command can only be used in a server!');
      return;
    }

    try {
      const channel = message.guild.channels.cache.get(channelId);
      if (!channel) {
        await message.reply('❌ Channel not found!');
        return;
      }

      // Move to archived category or add archived prefix
      await channel.setName(`archived-${channel.name}`, reason);
      await message.reply(`📁 Channel archived successfully!`);

    } catch (error) {
      console.error('❌ Error archiving channel:', error);
      await message.reply('❌ Failed to archive channel!');
    }
  }

  private async deleteChannel(message: Message, args: any) {
    const { channelId, reason = 'Channel deleted' } = args;
    
    if (!message.guild) {
      await message.reply('❌ This command can only be used in a server!');
      return;
    }

    try {
      // Ask for confirmation from event host
      const confirmationMessage = await message.reply('⚠️ Are you sure you want to delete this channel? Type "CONFIRM" to proceed (expires in 30 seconds).');
      
      const filter = (m: any) => m.author.id === message.author.id && m.content === 'CONFIRM';
      const textChannel = message.channel as any;
      const collected = await textChannel.awaitMessages({ filter, max: 1, time: 30000 });

      if (collected.size === 0) {
        await message.reply('❌ Channel deletion cancelled (timeout).');
        return;
      }

      const channel = message.guild.channels.cache.get(channelId);
      if (!channel) {
        await message.reply('❌ Channel not found!');
        return;
      }

      await channel.delete(reason);
      // Note: Can't reply to message after channel is deleted, so we log it
      console.log(`✅ Channel ${channel.name} deleted successfully by ${message.author.username}`);

    } catch (error) {
      console.error('❌ Error deleting channel:', error);
      await message.reply('❌ Failed to delete channel!');
    }
  }

  private async renameChannel(message: Message, args: any) {
    const { channelId, newName, reason = 'Channel renamed' } = args;
    
    if (!message.guild) {
      await message.reply('❌ This command can only be used in a server!');
      return;
    }

    try {
      const channel = message.guild.channels.cache.get(channelId);
      if (!channel) {
        await message.reply('❌ Channel not found!');
        return;
      }

      const oldName = channel.name;
      await channel.setName(newName, reason);
      await message.reply(`✅ Channel renamed from "${oldName}" to "${newName}"!`);

    } catch (error) {
      console.error('❌ Error renaming channel:', error);
      await message.reply('❌ Failed to rename channel!');
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
