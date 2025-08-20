import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DMAnalyticsRequest {
  hostDiscordId: string;
  eventId: string;
  guildId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { hostDiscordId, eventId, guildId }: DMAnalyticsRequest = await req.json();

    console.log(`Sending DM analytics for event ${eventId} to host ${hostDiscordId}`);

    // Get analytics data
    const analyticsResponse = await fetch(`${supabaseUrl}/functions/v1/discord-analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ eventId, hostDiscordId, guildId })
    });

    if (!analyticsResponse.ok) {
      throw new Error('Failed to fetch analytics data');
    }

    const { analytics } = await analyticsResponse.json();

    // Generate AI-powered insights using Gemini
    const insightsPrompt = `
Based on this event analytics data, provide 3-4 actionable insights and recommendations for the event host:

Event: ${analytics.eventName}
Total Attendees: ${analytics.totalAttendees}
Attendance Rate: ${analytics.attendanceRate}%
Total Messages: ${analytics.engagementMetrics.totalMessages}
Unique Participants: ${analytics.engagementMetrics.uniqueParticipants}
Average Sentiment: ${analytics.engagementMetrics.averageSentiment}

Top Engagers:
${analytics.engagementMetrics.topEngagers.map(e => `- ${e.discordHandle}: ${e.messageCount} messages`).join('\n')}

Please provide insights in a friendly, actionable format that would be helpful for improving future events.
`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: insightsPrompt
          }]
        }]
      }),
    });

    const geminiData = await geminiResponse.json();
    const aiInsights = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate insights at this time.";

    // Format the analytics message
    const analyticsMessage = `
🎉 **Event Analytics for ${analytics.eventName}**

📊 **Quick Stats:**
• Total Attendees: ${analytics.totalAttendees}
• Attendance Rate: ${analytics.attendanceRate}%
• Post-Event Messages: ${analytics.engagementMetrics.totalMessages}
• Active Participants: ${analytics.engagementMetrics.uniqueParticipants}
• Average Sentiment: ${analytics.engagementMetrics.averageSentiment > 0.6 ? '😊 Positive' : analytics.engagementMetrics.averageSentiment > 0.4 ? '😐 Neutral' : '😔 Needs Improvement'}

🏆 **Top Engagers:**
${analytics.engagementMetrics.topEngagers.slice(0, 3).map((e, i) => 
  `${i + 1}. ${e.discordHandle} - ${e.messageCount} messages`
).join('\n')}

🤖 **AI Insights:**
${aiInsights}

💡 **Suggestions:**
${analytics.suggestions.map(s => `• ${s}`).join('\n')}

Want more detailed analytics? Reply with "dashboard" for a full report link!
    `.trim();

    // Send DM to the host via Discord API
    const dmResponse = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${discordBotToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_id: hostDiscordId
      })
    });

    if (!dmResponse.ok) {
      throw new Error('Failed to create DM channel');
    }

    const dmChannel = await dmResponse.json();

    // Send the analytics message
    const messageResponse = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${discordBotToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: analyticsMessage
      })
    });

    if (!messageResponse.ok) {
      throw new Error('Failed to send DM');
    }

    console.log(`Analytics DM sent successfully to ${hostDiscordId}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Analytics DM sent successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending analytics DM:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to send analytics DM',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});