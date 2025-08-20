import { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  Message,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder
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
  type: 'meaningful' | 'spam' | 'casual' | 'question';
  score: number;
  shouldRespond: boolean;
  topic: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface AIResponse {
  text: string;
  shouldTag: boolean;
  suggestedTags: string[];
  engagementLevel: 'high' | 'medium' | 'low' | 'spam';
}

export class EventBuddyBot {
  private client: Client;
  private supabase: ReturnType<typeof createClient>;
  private gemini: GoogleGenerativeAI;
  private isReady = false;

  constructor(config: BotConfig) {
    // Initialize Discord client with necessary intents
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ]
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
      this.isReady = true;
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      await this.handleSlashCommand(interaction);
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      await this.handleMessage(message);
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
        )
    ];

    this.client.once('ready', async () => {
      try {
        const devGuildId = process.env.DEV_GUILD_ID;
        if (devGuildId) {
          console.log(`🔄 Registering GUILD commands for ${devGuildId} (instant updates)`);
          const guild = await this.client.guilds.fetch(devGuildId);
          await guild.commands.set(commands);
          console.log('✅ Guild slash commands registered successfully!');
        } else {
          console.log('🔄 Registering GLOBAL commands (may take minutes to propagate)');
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
        default:
          await interaction.reply({ content: '❌ Unknown command!', ephemeral: true });
      }
    } catch (error) {
      console.error(`Error handling command ${commandName}:`, error);
      if (!interaction.replied) {
        await interaction.reply({ content: '❌ An error occurred while processing your command.', ephemeral: true });
      }
    }
  }

  private async handleImportEvent(interaction: ChatInputCommandInteraction) {
    // Check if this is a private channel or DM
    if (!this.isPrivateChannel(interaction)) {
      return interaction.reply({ 
        content: '❌ This command can only be used in DMs or private channels!', 
        ephemeral: true 
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const eventName = interaction.options.getString('event_name')!;
    const csvFile = interaction.options.getAttachment('csv_file')!;

    if (!csvFile.url.endsWith('.csv')) {
      return interaction.editReply('❌ Please upload a valid CSV file!');
    }

    try {
      // Download and parse CSV
      const csvData = await this.downloadAndParseCSV(csvFile.url);
      const attendees = await this.parseCSVData(csvData);

      // Ask for tagging preference
      const taggingEmbed = new EmbedBuilder()
        .setTitle('🏷️ Tagging Preference')
        .setDescription('How would you like to tag attendees in reminders?')
        .addFields(
          { name: '👥 Individual', value: 'Tag each attendee individually (@user1, @user2)', inline: true },
          { name: '📢 Everyone', value: 'Use @everyone for all announcements', inline: true }
        )
        .setColor(0x5865F2);

      await interaction.editReply({ 
        content: '📊 **CSV processed successfully!**\nChoose your tagging preference:', 
        embeds: [taggingEmbed] 
      });

      // In a real implementation, you'd handle the response with a collector
      const taggingMode = 'individual'; // Default for now

      // Store event data
      const { data: eventData, error } = await this.supabase
        .from('events')
        .insert({
          name: eventName,
          host_id: interaction.user.id,
          guild_id: interaction.guildId,
          tagging_mode: taggingMode,
          csv_data: csvData,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Store attendees
      const attendeeRecords = attendees.map(attendee => ({
        event_id: eventData.id,
        name: attendee.name,
        email: attendee.email,
        discord_handle: attendee.discordHandle,
        ticket_type: attendee.ticketType,
        rsvp_status: attendee.rsvpStatus
      }));

      await this.supabase.from('attendees').insert(attendeeRecords);

      // Schedule reminders
      await this.scheduleReminders(eventData.id as string);

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Event Imported Successfully!')
        .addFields(
          { name: '📊 Attendees', value: attendees.length.toString(), inline: true },
          { name: '🏷️ Tagging Mode', value: taggingMode, inline: true },
          { name: '⏰ Reminders', value: 'Scheduled', inline: true }
        )
        .setColor(0x00ff00);

      await interaction.followUp({ embeds: [successEmbed], ephemeral: true });

    } catch (error) {
      console.error('Error importing event:', error);
      await interaction.editReply('❌ Error processing CSV file. Please check the format and try again.');
    }
  }

  private async handleEndEvent(interaction: ChatInputCommandInteraction) {
    if (!this.isPrivateChannel(interaction)) {
      return interaction.reply({ 
        content: '❌ Private channels only!', 
        ephemeral: true 
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Find active event for this host
      const { data: activeEvent } = await this.supabase
        .from('events')
        .select('*')
        .eq('host_id', interaction.user.id)
        .eq('guild_id', interaction.guildId)
        .eq('status', 'active')
        .single();

      if (!activeEvent) {
        return interaction.editReply('❌ No active event found!');
      }

      // Create post-event channel
      const eventName = (activeEvent.name as string).toLowerCase().replace(/\s+/g, '-');
      const channelName = `${eventName}-${new Date().getMonth() + 1}${new Date().getDate()}`;
      
      const guild = await this.client.guilds.fetch(interaction.guildId!);
      const postEventChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        topic: `Post-event discussion for ${activeEvent.name}`,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }
        ]
      });

      // Generate and post icebreakers
      const eventData: EventData = {
        id: activeEvent.id as string,
        name: activeEvent.name as string,
        attendees: [],
        taggingMode: (activeEvent.tagging_mode as 'individual' | 'everyone') || 'individual',
        guildId: activeEvent.guild_id as string,
        status: 'ended'
      };
      
      const icebreakers = await this.generateIcebreakers(eventData);
      await this.deployIcebreakers(postEventChannel.id, icebreakers, eventData);

      // Update event status
      await this.supabase
        .from('events')
        .update({ 
          status: 'ended', 
          post_event_channel_id: postEventChannel.id 
        })
        .eq('id', activeEvent.id);

      const successEmbed = new EmbedBuilder()
        .setTitle('🎉 Event Ended Successfully!')
        .addFields(
          { name: '📍 Channel', value: `<#${postEventChannel.id}>`, inline: true },
          { name: '💬 Icebreakers', value: 'Posted', inline: true },
          { name: '📊 Analytics', value: 'Available in 24-48 hours', inline: true }
        )
        .setColor(0x00ff00);

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error ending event:', error);
      await interaction.editReply('❌ Error ending event. Please try again.');
    }
  }

  private async handleAnalytics(interaction: ChatInputCommandInteraction) {
    if (!this.isPrivateChannel(interaction)) {
      return interaction.reply({ 
        content: '❌ Private channels only!', 
        ephemeral: true 
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Get analytics data
      const analytics = await this.generateAnalytics(interaction.user.id, interaction.guildId!);

      const analyticsEmbed = new EmbedBuilder()
        .setTitle('📊 Event Analytics')
        .addFields(
          { name: '👥 Total Attendees', value: analytics.totalAttendees.toString(), inline: true },
          { name: '💬 Messages Sent', value: analytics.totalMessages.toString(), inline: true },
          { name: '📈 Engagement Rate', value: `${analytics.engagementRate}%`, inline: true },
          { name: '🔥 Top Contributors', value: analytics.topContributors.join(', ') || 'None yet', inline: false }
        )
        .setColor(0x5865F2);

      await interaction.editReply({ embeds: [analyticsEmbed] });

    } catch (error) {
      console.error('Error generating analytics:', error);
      await interaction.editReply('❌ Error generating analytics.');
    }
  }

  private async handleHelp(interaction: ChatInputCommandInteraction) {
    const helpEmbed = new EmbedBuilder()
      .setTitle('🤖 EventBuddy Commands')
      .setDescription('AI-powered Discord event management')
      .addFields(
        { 
          name: '🔒 Admin Commands (Private only)', 
          value: '`/import_event` - Import CSV data\n`/end_event` - Create post-event channel\n`/analytics` - View engagement metrics',
          inline: false 
        },
        { 
          name: '🌐 Public Commands', 
          value: '`/help` - Show this help\n`/input` - Chat with AI',
          inline: false 
        },
        {
          name: '📋 CSV Format',
          value: 'Required columns: Name, Email, Discord Handle, Ticket Type, RSVP Status',
          inline: false
        }
      )
      .setColor(0x5865F2);

    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  }

  private async handleInputCommand(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const userMessage = interaction.options.getString('message')!;
    
    try {
      const response = await this.generateAIResponse({
        message: userMessage,
        author: interaction.user,
        channelId: interaction.channelId,
        isSlashCommand: true
      });

      await interaction.editReply(response.text);

    } catch (error) {
      console.error('Error generating AI response:', error);
      await interaction.editReply('❌ Sorry, I encountered an error processing your message.');
    }
  }

  private async handleMessage(message: Message) {
    // Skip if bot message or not relevant
    if (message.author.bot) return;

    // Only respond in post-event channels or when mentioned
    const shouldRespond = await this.shouldRespondToMessage(message);
    if (!shouldRespond) return;

    try {
      // Analyze message
      const analysis = await this.analyzeMessage(message.content, {
        author: message.author,
        channelId: message.channelId
      });

      // Store conversation
      await this.storeConversation(message, analysis);

      // Generate response based on analysis
      if (analysis.shouldRespond && analysis.score > 0.3) {
        const response = await this.generateEngagingResponse(message, analysis);
        
        if (response) {
          const sentMessage = await message.reply(response.text);
          
          // Update conversation with AI response
          await this.updateConversationWithResponse(message.id, response);
        }
      }

    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  // Utility methods
  private isPrivateChannel(interaction: ChatInputCommandInteraction): boolean {
    // Check if it's a DM by looking at guild ID
    return !interaction.guildId;
  }

  private async downloadAndParseCSV(url: string): Promise<string> {
    const response = await fetch(url);
    return await response.text();
  }

  private async parseCSVData(csvData: string): Promise<AttendeeData[]> {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const attendees: AttendeeData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 5) {
        attendees.push({
          name: values[0],
          email: values[1],
          discordHandle: values[2],
          ticketType: values[3] || 'Standard',
          rsvpStatus: values[4] || 'Confirmed'
        });
      }
    }
    
    return attendees;
  }

  private async scheduleReminders(eventId: string): Promise<void> {
    // Schedule reminder 24 hours before event
    const reminderTime = new Date();
    reminderTime.setHours(reminderTime.getHours() + 24);

    await this.supabase.from('scheduled_jobs').insert({
      job_type: 'reminder',
      payload: { eventId, type: 'pre_event' },
      scheduled_for: reminderTime.toISOString()
    });
  }

  private async generateIcebreakers(event: EventData): Promise<string[]> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Generate 3 engaging icebreaker questions for a post-event discussion about "${event.name}". 
    Make them thoughtful, relevant to networking, and encourage participants to share insights.
    Format: Return just the questions, one per line.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text().split('\n').filter(line => line.trim());
  }

  private async deployIcebreakers(channelId: string, icebreakers: string[], event: EventData): Promise<void> {
    const channel = await this.client.channels.fetch(channelId);
    if (!channel?.isTextBased()) return;

    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`🎉 Welcome to ${event.name} Networking!`)
      .setDescription('Great to see everyone here! Let\'s continue the conversation and make some connections.')
      .setColor(0x5865F2);

    if ('send' in channel) {
      await channel.send({ embeds: [welcomeEmbed] });

      // Post icebreakers with delay
      for (let i = 0; i < icebreakers.length; i++) {
        setTimeout(async () => {
          if ('send' in channel) {
            await channel.send(`💭 **Icebreaker ${i + 1}:** ${icebreakers[i]}`);
          }
        }, (i + 1) * 2000);
      }
    }
  }

  private async shouldRespondToMessage(message: Message): Promise<boolean> {
    // Check if it's a post-event channel
    const { data: event } = await this.supabase
      .from('events')
      .select('id')
      .eq('post_event_channel_id', message.channelId)
      .single();

    return !!event || message.mentions.has(this.client.user!);
  }

  private async analyzeMessage(content: string, context: any): Promise<MessageAnalysis> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Analyze this message for engagement quality in a post-event networking context:
    
Message: "${content}"

Classify as:
- meaningful: Substantive contribution, question, or insight (score 0.7-1.0)  
- spam: Single characters, dots, irrelevant content (score 0.0-0.2)
- casual: Brief but relevant responses (score 0.3-0.6)
- question: Direct questions seeking information

Return JSON: {"type": "meaningful", "score": 0.8, "shouldRespond": true, "topic": "event insights", "sentiment": "positive"}`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Error analyzing message:', error);
      return {
        type: 'casual',
        score: 0.5,
        shouldRespond: true,
        topic: 'general',
        sentiment: 'neutral'
      };
    }
  }

  private async generateEngagingResponse(message: Message, analysis: MessageAnalysis): Promise<AIResponse | null> {
    if (analysis.score < 0.3) return null;

    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are EventBuddy, a friendly AI facilitating post-event networking. 

Current message: "${message.content}"
Author: @${message.author.username}
Quality: ${analysis.type} (${analysis.score})

Generate a warm, engaging response that:
1. Acknowledges the contribution naturally
2. Asks a thoughtful follow-up question
3. Optionally suggests tagging relevant participants
4. Keeps conversation flowing
5. Stays professional but friendly

Tone: Conversational, encouraging, human-like
Length: 1-2 sentences max
Response:`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        text,
        shouldTag: text.includes('@'),
        suggestedTags: this.extractMentions(text),
        engagementLevel: analysis.score > 0.7 ? 'high' : analysis.score > 0.4 ? 'medium' : 'low'
      };
    } catch (error) {
      console.error('Error generating response:', error);
      return null;
    }
  }

  private async generateAIResponse(context: any): Promise<AIResponse> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent(context.message);
    const response = await result.response;
    
    return {
      text: response.text(),
      shouldTag: false,
      suggestedTags: [],
      engagementLevel: 'medium'
    };
  }

  private extractMentions(text: string): string[] {
    const mentions = text.match(/@\w+/g);
    return mentions ? mentions.map(m => m.substring(1)) : [];
  }

  private async storeConversation(message: Message, analysis: MessageAnalysis): Promise<void> {
    await this.supabase.from('conversations').insert({
      channel_id: message.channelId,
      message_id: message.id,
      author_discord_id: message.author.id,
      content: message.content,
      engagement_score: analysis.score,
      response_type: analysis.type
    });
  }

  private async updateConversationWithResponse(messageId: string, response: AIResponse): Promise<void> {
    await this.supabase
      .from('conversations')
      .update({
        ai_response: response.text,
        tagged_users: response.suggestedTags
      })
      .eq('message_id', messageId);
  }

  private async generateAnalytics(hostId: string, guildId: string): Promise<any> {
    // Get event data for this host/guild
    const { data: events } = await this.supabase
      .from('events')
      .select('id, name')
      .eq('host_id', hostId)
      .eq('guild_id', guildId);

    if (!events || events.length === 0) {
      return {
        totalAttendees: 0,
        totalMessages: 0,
        engagementRate: 0,
        topContributors: []
      };
    }

    // Calculate metrics
    const eventIds = events.map(e => e.id);
    
    const { count: attendeeCount } = await this.supabase
      .from('attendees')
      .select('*', { count: 'exact' })
      .in('event_id', eventIds);

    const { count: messageCount } = await this.supabase
      .from('conversations')
      .select('*', { count: 'exact' })
      .in('event_id', eventIds);

    const engagementRate = attendeeCount ? Math.round((messageCount || 0) / attendeeCount * 100) : 0;

    return {
      totalAttendees: attendeeCount || 0,
      totalMessages: messageCount || 0,
      engagementRate,
      topContributors: [] // TODO: Implement top contributors logic
    };
  }

  public async start(token: string): Promise<void> {
    console.log('🚀 Starting EventBuddy bot...');
    await this.client.login(token);
  }

  public async stop(): Promise<void> {
    this.client.destroy();
    console.log('🛑 EventBuddy bot stopped.');
  }
}


