import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsRequest {
  eventId: string;
  hostDiscordId: string;
  guildId: string;
}

interface AnalyticsData {
  eventName: string;
  totalAttendees: number;
  attendanceRate: number;
  engagementMetrics: {
    totalMessages: number;
    uniqueParticipants: number;
    averageSentiment: number;
    topEngagers: Array<{
      discordHandle: string;
      messageCount: number;
      sentimentScore: number;
    }>;
  };
  suggestions: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { eventId, hostDiscordId, guildId }: AnalyticsRequest = await req.json();

    console.log(`Generating analytics for event ${eventId} in guild ${guildId}`);

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('host_discord_id', hostDiscordId)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found or access denied');
    }

    // Get attendees
    const { data: attendees, error: attendeesError } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', eventId);

    if (attendeesError) {
      throw new Error('Failed to fetch attendees');
    }

    // Get conversations
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .eq('event_id', eventId);

    if (conversationsError) {
      console.warn('Failed to fetch conversations:', conversationsError);
    }

    // Calculate analytics
    const totalAttendees = attendees?.length || 0;
    const engagedAttendees = attendees?.filter(a => a.has_engaged).length || 0;
    const attendanceRate = totalAttendees > 0 ? (engagedAttendees / totalAttendees) * 100 : 0;

    const totalMessages = conversations?.length || 0;
    const uniqueParticipants = new Set(conversations?.map(c => c.discord_user_id)).size;
    
    // Calculate average sentiment
    const sentimentScores = conversations?.map(c => c.sentiment_score).filter(s => s !== null) || [];
    const averageSentiment = sentimentScores.length > 0 
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length 
      : 0;

    // Find top engagers
    const userMessageCount = conversations?.reduce((acc, conv) => {
      const userId = conv.discord_user_id;
      if (!acc[userId]) {
        acc[userId] = { count: 0, totalSentiment: 0, sentimentCount: 0 };
      }
      acc[userId].count++;
      if (conv.sentiment_score !== null) {
        acc[userId].totalSentiment += conv.sentiment_score;
        acc[userId].sentimentCount++;
      }
      return acc;
    }, {} as Record<string, { count: number; totalSentiment: number; sentimentCount: number }>) || {};

    const topEngagers = Object.entries(userMessageCount)
      .map(([userId, data]) => ({
        discordHandle: userId, // In real implementation, map to actual handles
        messageCount: data.count,
        sentimentScore: data.sentimentCount > 0 ? data.totalSentiment / data.sentimentCount : 0
      }))
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 5);

    // Generate suggestions based on analytics
    const suggestions = [];
    if (attendanceRate < 50) {
      suggestions.push("Consider sending more engaging pre-event reminders to boost attendance");
    }
    if (averageSentiment > 0.7) {
      suggestions.push("Great positive sentiment! Consider similar themes for future events");
    } else if (averageSentiment < 0.3) {
      suggestions.push("Consider adjusting event format or content based on feedback");
    }
    if (uniqueParticipants < totalAttendees * 0.3) {
      suggestions.push("Try more interactive icebreakers to encourage participation");
    }
    if (totalMessages < 10) {
      suggestions.push("Consider longer post-event networking time or better conversation starters");
    }

    const analyticsData: AnalyticsData = {
      eventName: event.event_name,
      totalAttendees,
      attendanceRate: Math.round(attendanceRate),
      engagementMetrics: {
        totalMessages,
        uniqueParticipants,
        averageSentiment: Math.round(averageSentiment * 100) / 100,
        topEngagers
      },
      suggestions
    };

    console.log('Analytics generated successfully:', analyticsData);

    return new Response(JSON.stringify({ 
      success: true, 
      analytics: analyticsData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating analytics:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});