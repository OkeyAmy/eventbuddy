-- EventBuddy Database Schema for Supabase
-- Complete schema with RLS policies for multi-tenant support

-- Enable Row Level Security
SET row_security = on;

-- Create hosts table
CREATE TABLE hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  guild_id TEXT, -- Main server they manage
  settings JSONB DEFAULT '{
    "default_tagging_mode": "individual",
    "reminder_hours_before": 24,
    "analytics_level": "basic"
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES hosts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT DEFAULT 'luma', -- luma, eventbrite, meetup
  event_date TIMESTAMP WITH TIME ZONE,
  guild_id TEXT NOT NULL, -- Discord server
  channel_id TEXT, -- #events channel for reminders
  post_event_channel_id TEXT, -- Created after !end_event
  tagging_mode TEXT DEFAULT 'individual', -- 'individual' or 'everyone'
  status TEXT DEFAULT 'active', -- active, ended, archived
  csv_data JSONB, -- Store processed CSV for reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_tagging_mode CHECK (tagging_mode IN ('individual', 'everyone')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'ended', 'archived')),
  CONSTRAINT valid_platform CHECK (platform IN ('luma', 'eventbrite', 'meetup', 'custom'))
);

-- Create attendees table
CREATE TABLE attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  discord_handle TEXT NOT NULL, -- From CSV: "CodeNinja#1234" or "codeninja"
  discord_id TEXT, -- Resolved from handle when they interact
  ticket_type TEXT DEFAULT 'Standard',
  rsvp_status TEXT DEFAULT 'Confirmed',
  additional_data JSONB DEFAULT '{}', -- Extra CSV columns
  first_interaction TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_rsvp_status CHECK (rsvp_status IN ('Confirmed', 'Pending', 'Declined', 'Cancelled'))
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL, -- Discord channel ID
  message_id TEXT NOT NULL UNIQUE, -- Discord message ID
  author_discord_id TEXT NOT NULL,
  content TEXT NOT NULL,
  ai_response TEXT, -- Bot's response if any
  engagement_score FLOAT DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 1),
  response_type TEXT DEFAULT 'casual', -- 'meaningful', 'spam', 'question', 'greeting'
  tagged_users JSONB DEFAULT '[]', -- Users tagged in bot response
  sentiment TEXT DEFAULT 'neutral', -- 'positive', 'neutral', 'negative'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_response_type CHECK (response_type IN ('meaningful', 'spam', 'casual', 'question', 'greeting')),
  CONSTRAINT valid_sentiment CHECK (sentiment IN ('positive', 'neutral', 'negative'))
);

-- Create analytics table
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'attendance_rate', 'engagement_score', 'response_count'
  metric_value FLOAT NOT NULL,
  breakdown JSONB DEFAULT '{}', -- Detailed breakdown data
  time_period TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_metric_type CHECK (metric_type IN ('attendance_rate', 'engagement_score', 'response_count', 'channel_activity', 'user_participation')),
  CONSTRAINT valid_time_period CHECK (time_period IN ('hourly', 'daily', 'weekly', 'monthly'))
);

-- Create scheduled_jobs table for reminders and tasks
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL, -- 'reminder', 'analytics_generation', 'channel_archive'
  payload JSONB NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, completed, failed, cancelled
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_job_type CHECK (job_type IN ('reminder', 'analytics_generation', 'channel_archive', 'cleanup')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'))
);

-- Create indexes for performance
CREATE INDEX idx_hosts_discord_id ON hosts(discord_id);
CREATE INDEX idx_events_host_id ON events(host_id);
CREATE INDEX idx_events_guild_id ON events(guild_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_attendees_event_id ON attendees(event_id);
CREATE INDEX idx_attendees_discord_handle ON attendees(discord_handle);
CREATE INDEX idx_attendees_discord_id ON attendees(discord_id);
CREATE INDEX idx_conversations_event_id ON conversations(event_id);
CREATE INDEX idx_conversations_channel_id ON conversations(channel_id);
CREATE INDEX idx_conversations_author ON conversations(author_discord_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_analytics_event_id ON analytics(event_id);
CREATE INDEX idx_scheduled_jobs_status_scheduled ON scheduled_jobs(status, scheduled_for);

-- Enable Row Level Security on all tables
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Hosts: Users can only access their own data
CREATE POLICY "hosts_own_data" ON hosts
FOR ALL USING (discord_id = current_setting('app.current_user_discord_id', true));

-- Events: Hosts can only access events they created
CREATE POLICY "events_host_access" ON events
FOR ALL USING (host_id IN (
  SELECT id FROM hosts WHERE discord_id = current_setting('app.current_user_discord_id', true)
));

-- Attendees: Access based on event ownership
CREATE POLICY "attendees_event_access" ON attendees
FOR ALL USING (event_id IN (
  SELECT e.id FROM events e
  JOIN hosts h ON e.host_id = h.id
  WHERE h.discord_id = current_setting('app.current_user_discord_id', true)
));

-- Conversations: Access based on event ownership
CREATE POLICY "conversations_event_access" ON conversations
FOR ALL USING (event_id IN (
  SELECT e.id FROM events e
  JOIN hosts h ON e.host_id = h.id
  WHERE h.discord_id = current_setting('app.current_user_discord_id', true)
));

-- Analytics: Access based on event ownership
CREATE POLICY "analytics_event_access" ON analytics
FOR ALL USING (event_id IN (
  SELECT e.id FROM events e
  JOIN hosts h ON e.host_id = h.id
  WHERE h.discord_id = current_setting('app.current_user_discord_id', true)
));

-- Scheduled Jobs: Access based on related event ownership
CREATE POLICY "scheduled_jobs_event_access" ON scheduled_jobs
FOR ALL USING (
  CASE 
    WHEN payload ? 'eventId' THEN
      (payload->>'eventId')::UUID IN (
        SELECT e.id FROM events e
        JOIN hosts h ON e.host_id = h.id
        WHERE h.discord_id = current_setting('app.current_user_discord_id', true)
      )
    ELSE true -- Allow access to jobs without event context
  END
);

-- Functions for data management

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_hosts_updated_at BEFORE UPDATE ON hosts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old conversations (optional)
CREATE OR REPLACE FUNCTION cleanup_old_conversations()
RETURNS void AS $$
BEGIN
    DELETE FROM conversations 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND event_id IN (
        SELECT id FROM events WHERE status = 'archived'
    );
END;
$$ language 'plpgsql';

-- Function to calculate engagement metrics
CREATE OR REPLACE FUNCTION calculate_engagement_metrics(p_event_id UUID)
RETURNS TABLE (
    total_messages INTEGER,
    unique_participants INTEGER,
    avg_engagement_score FLOAT,
    top_contributors JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_messages,
        COUNT(DISTINCT author_discord_id)::INTEGER as unique_participants,
        AVG(engagement_score)::FLOAT as avg_engagement_score,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'discord_id', author_discord_id,
                    'message_count', message_count,
                    'avg_score', avg_score
                ) ORDER BY message_count DESC
            ) FILTER (WHERE rn <= 5),
            '[]'::jsonb
        ) as top_contributors
    FROM (
        SELECT 
            author_discord_id,
            COUNT(*) as message_count,
            AVG(engagement_score) as avg_score,
            ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rn
        FROM conversations
        WHERE event_id = p_event_id
        GROUP BY author_discord_id
    ) ranked_contributors;
END;
$$ language 'plpgsql';

-- Insert sample host for testing (remove in production)
-- INSERT INTO hosts (discord_id, username, guild_id) 
-- VALUES ('123456789012345678', 'TestHost', '987654321098765432');

-- Grant necessary permissions (adjust for your setup)
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;