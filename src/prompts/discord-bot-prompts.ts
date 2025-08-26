// Discord Bot Prompts - Centralized prompts for EventBuddy

export const DISCORD_BOT_PROMPTS = {
  // System prompt for natural language processing
  SYSTEM_PROMPT: `You are EventBuddy, a friendly Discord bot that helps manage events and servers. 

You can:
- Create and manage events
- Create, archive, delete, and rename channels  
- Provide analytics and insights
- Engage in natural conversation

Important Guidelines:
- Always be helpful and friendly
- When users ask about active events, automatically check the database for their events
- When users want to create channels, automatically create text channels for them
- Only text channels can be created (no voice channels)
- Be proactive in helping users with event management

Context: This is a Discord server where you help with event management.`,

  // Response when user lacks permissions for slash commands
  PERMISSION_DENIED: "🔒 Only the server owner can use slash commands. However, I'm here to help! You can ask me anything about events or request me to create channels just by typing your message.",

  // Help message for regular users (non-owners)
  USER_HELP: `👋 **EventBuddy Help**

I'm here to help you with events and server management! Here's what you can ask me:

**Event Management:**
• "Do I have any active events?" - Check your current events
• "Create an event called [name]" - Create a new event
• "End my current event" - End an active event

**Channel Management:**
• "Create a channel called [name]" - Create a new text channel
• "Archive the [channel] channel" - Archive a channel
• "Rename [channel] to [new name]" - Rename a channel

**General:**
Just ask me anything naturally! I can help with event planning, server organization, and answer questions.

💡 **Tip:** I can automatically check your events and create channels - just ask naturally!`,

  // Help message for server owners
  OWNER_HELP: `👑 **EventBuddy Help - Server Owner**

**Slash Commands (Owner Only):**
• \`/import_event\` - Import event data from CSV
• \`/end_event\` - End current event and create post-event channel
• \`/analytics\` - Get detailed event analytics
• \`/create_event\` - Create a new event with options
• \`/input\` - Send a message to AI for processing

**Natural Language (Everyone):**
• "Do I have any active events?" - Check current events
• "Create a channel called [name]" - Create text channels
• "Archive/rename channels" - Channel management
• Ask any questions about events or server management

**Admin Features:**
• CSV import with attendee data
• Advanced analytics and insights
• Bulk event management
• Channel permissions management

💡 **Tip:** Both slash commands and natural language work for you!`,

  // Channel creation success message
  CHANNEL_CREATED: (channelName: string, purpose?: string) => 
    `✅ Successfully created #${channelName}${purpose ? ` for ${purpose}` : ''}!`,

  // Event check responses
  NO_ACTIVE_EVENTS: "📅 You don't have any active events at the moment. Would you like me to help you create one?",
  
  ACTIVE_EVENTS_FOUND: (events: any[]) => {
    const eventList = events.map(e => `• **${e.name}** (${e.status})`).join('\n');
    return `📅 **Your Active Events:**\n${eventList}\n\nNeed help managing any of these events?`;
  },

  // Error messages
  ERROR_GENERIC: "❌ Something went wrong. Please try again or contact the server owner.",
  ERROR_CHANNEL_CREATE: "❌ I couldn't create that channel. Please check if I have the right permissions.",
  ERROR_DATABASE: "❌ I'm having trouble accessing the database. Please try again in a moment.",
};