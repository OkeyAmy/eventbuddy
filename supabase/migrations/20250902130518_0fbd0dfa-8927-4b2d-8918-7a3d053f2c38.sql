-- Create conversation_history table for per-user per-channel logging
CREATE TABLE public.conversation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  message_content TEXT,
  sender_id TEXT NOT NULL, -- Can be user or 'AI'
  sender_username TEXT,
  message_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ai_response TEXT,
  context_used JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying by user and channel
CREATE INDEX idx_conversation_history_user_channel ON public.conversation_history(user_id, channel_id);
CREATE INDEX idx_conversation_history_timestamp ON public.conversation_history(message_timestamp DESC);
CREATE INDEX idx_conversation_history_guild ON public.conversation_history(guild_id);

-- Create user_channel_preferences table for AI learning preferences
CREATE TABLE public.user_channel_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  preference_type TEXT NOT NULL, -- 'response_style', 'tone', 'detail_level', etc.
  preference_value TEXT NOT NULL,
  preference_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel_id, preference_type)
);

-- Create channel_metadata table for channel context
CREATE TABLE public.channel_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id TEXT NOT NULL UNIQUE,
  guild_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  channel_purpose TEXT,
  created_by TEXT NOT NULL, -- Discord user ID or 'AI'
  message_count INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ai_personality_context JSONB DEFAULT '{}'::jsonb, -- Store channel-specific AI context
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_channel_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversation_history
CREATE POLICY "Allow all access to conversation_history" 
ON public.conversation_history 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create RLS policies for user_channel_preferences  
CREATE POLICY "Allow all access to user_channel_preferences" 
ON public.user_channel_preferences 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create RLS policies for channel_metadata
CREATE POLICY "Allow all access to channel_metadata" 
ON public.channel_metadata 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Function to maintain 10,000 message limit per user per channel
CREATE OR REPLACE FUNCTION public.maintain_conversation_limit()
RETURNS TRIGGER AS $$
DECLARE
  message_count INTEGER;
  oldest_message_id UUID;
BEGIN
  -- Count messages for this user in this channel
  SELECT COUNT(*) INTO message_count
  FROM public.conversation_history 
  WHERE user_id = NEW.user_id AND channel_id = NEW.channel_id;
  
  -- If we exceed 10,000 messages, delete the oldest ones
  WHILE message_count >= 10000 LOOP
    -- Get the oldest message ID
    SELECT id INTO oldest_message_id
    FROM public.conversation_history 
    WHERE user_id = NEW.user_id AND channel_id = NEW.channel_id
    ORDER BY message_timestamp ASC 
    LIMIT 1;
    
    -- Delete the oldest message
    DELETE FROM public.conversation_history WHERE id = oldest_message_id;
    
    -- Update count
    message_count := message_count - 1;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain conversation limit
CREATE TRIGGER conversation_limit_trigger
  AFTER INSERT ON public.conversation_history
  FOR EACH ROW
  EXECUTE FUNCTION public.maintain_conversation_limit();

-- Function to update channel metadata message count
CREATE OR REPLACE FUNCTION public.update_channel_message_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update message count and last activity for the channel
  UPDATE public.channel_metadata 
  SET 
    message_count = message_count + 1,
    last_activity = now(),
    updated_at = now()
  WHERE channel_id = NEW.channel_id;
  
  -- If channel doesn't exist in metadata, create it
  IF NOT FOUND THEN
    INSERT INTO public.channel_metadata (channel_id, guild_id, channel_name, created_by, message_count)
    VALUES (NEW.channel_id, NEW.guild_id, 'Unknown Channel', NEW.sender_id, 1)
    ON CONFLICT (channel_id) DO UPDATE SET
      message_count = channel_metadata.message_count + 1,
      last_activity = now(),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update channel metadata
CREATE TRIGGER update_channel_metadata_trigger
  AFTER INSERT ON public.conversation_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_channel_message_count();

-- Function to get conversation context for AI
CREATE OR REPLACE FUNCTION public.get_conversation_context(
  p_user_id TEXT,
  p_channel_id TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  message_content TEXT,
  sender_id TEXT,
  sender_username TEXT,
  ai_response TEXT,
  message_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ch.message_content,
    ch.sender_id,
    ch.sender_username,
    ch.ai_response,
    ch.message_timestamp
  FROM public.conversation_history ch
  WHERE ch.user_id = p_user_id AND ch.channel_id = p_channel_id
  ORDER BY ch.message_timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user preferences for a channel
CREATE OR REPLACE FUNCTION public.get_user_channel_preferences(
  p_user_id TEXT,
  p_channel_id TEXT
)
RETURNS TABLE (
  preference_type TEXT,
  preference_value TEXT,
  preference_description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ucp.preference_type,
    ucp.preference_value,
    ucp.preference_description
  FROM public.user_channel_preferences ucp
  WHERE ucp.user_id = p_user_id 
    AND ucp.channel_id = p_channel_id 
    AND ucp.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;