-- Create events table for storing event data
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_discord_id text NOT NULL,
  guild_id text NOT NULL,
  event_name text NOT NULL,
  event_date text,
  event_time text,
  event_theme text,
  total_attendees integer DEFAULT 0,
  channel_id text,
  post_event_channel_id text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'ended', 'archived')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create attendees table for event participants
CREATE TABLE public.attendees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  discord_handle text,
  ticket_type text,
  rsvp_status text DEFAULT 'confirmed',
  has_engaged boolean DEFAULT false,
  engagement_score integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create conversations table for AI analytics
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  discord_message_id text NOT NULL,
  discord_user_id text NOT NULL,
  channel_id text NOT NULL,
  message_content text,
  ai_analysis jsonb,
  sentiment_score decimal,
  engagement_level text,
  ai_response text,
  response_message_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create guild_settings table for server-specific bot configuration
CREATE TABLE public.guild_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id text NOT NULL UNIQUE,
  bot_added_by text NOT NULL,
  admin_role text,
  event_channel text,
  analytics_enabled boolean DEFAULT true,
  tagging_mode text DEFAULT 'individual' CHECK (tagging_mode IN ('individual', 'everyone')),
  ai_personality text DEFAULT 'friendly',
  settings jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for events table
CREATE POLICY "Events are accessible by host" 
ON public.events 
FOR ALL 
USING (true); -- For now, allow all access - will be restricted by Discord auth

-- Create policies for attendees table
CREATE POLICY "Attendees are accessible through events" 
ON public.attendees 
FOR ALL 
USING (true);

-- Create policies for conversations table
CREATE POLICY "Conversations are accessible for analytics" 
ON public.conversations 
FOR ALL 
USING (true);

-- Create policies for guild_settings table
CREATE POLICY "Guild settings are accessible by admins" 
ON public.guild_settings 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_events_host_discord_id ON public.events(host_discord_id);
CREATE INDEX idx_events_guild_id ON public.events(guild_id);
CREATE INDEX idx_attendees_event_id ON public.attendees(event_id);
CREATE INDEX idx_attendees_discord_handle ON public.attendees(discord_handle);
CREATE INDEX idx_conversations_event_id ON public.conversations(event_id);
CREATE INDEX idx_conversations_discord_user_id ON public.conversations(discord_user_id);
CREATE INDEX idx_guild_settings_guild_id ON public.guild_settings(guild_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendees_updated_at
BEFORE UPDATE ON public.attendees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guild_settings_updated_at
BEFORE UPDATE ON public.guild_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();