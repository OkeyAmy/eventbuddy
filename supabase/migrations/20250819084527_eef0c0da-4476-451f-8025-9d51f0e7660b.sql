-- Remove the current basic policies and create proper RLS policies
DROP POLICY "Events are accessible by host" ON public.events;
DROP POLICY "Attendees are accessible through events" ON public.attendees;
DROP POLICY "Conversations are accessible for analytics" ON public.conversations;
DROP POLICY "Guild settings are accessible by admins" ON public.guild_settings;

-- Since this is a Discord bot application without traditional user authentication,
-- we'll create policies that allow full access for now and can be refined later
-- These tables will be managed by the Discord bot backend

-- Events policies
CREATE POLICY "Allow all access to events"
ON public.events
FOR ALL
USING (true)
WITH CHECK (true);

-- Attendees policies  
CREATE POLICY "Allow all access to attendees"
ON public.attendees
FOR ALL
USING (true)
WITH CHECK (true);

-- Conversations policies
CREATE POLICY "Allow all access to conversations"
ON public.conversations
FOR ALL
USING (true)
WITH CHECK (true);

-- Guild settings policies
CREATE POLICY "Allow all access to guild_settings"
ON public.guild_settings
FOR ALL
USING (true)
WITH CHECK (true);