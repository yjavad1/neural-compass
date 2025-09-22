-- Fix critical security vulnerabilities in conversation tables

-- 1. Drop insecure policies that allow public access to all conversation data
DROP POLICY IF EXISTS "Allow all operations on conversation_messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "Allow all operations on conversation_sessions" ON public.conversation_sessions;
DROP POLICY IF EXISTS "Suggestions are publicly accessible" ON public.conversation_suggestions;

-- 2. Add session_token column to conversation_sessions for access control
ALTER TABLE public.conversation_sessions 
ADD COLUMN IF NOT EXISTS session_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex');

-- 3. Create secure RLS policies for conversation_sessions
-- Only allow access to sessions with matching session token
CREATE POLICY "Users can access sessions with valid token" 
ON public.conversation_sessions 
FOR ALL 
USING (
  session_token = current_setting('app.session_token', true)
);

-- 4. Create secure RLS policies for conversation_messages  
-- Only allow access to messages from sessions the user has access to
CREATE POLICY "Users can access messages from their sessions" 
ON public.conversation_messages 
FOR ALL 
USING (
  session_id IN (
    SELECT id FROM public.conversation_sessions 
    WHERE session_token = current_setting('app.session_token', true)
  )
);

-- 5. Create secure RLS policies for conversation_suggestions
-- Only allow access to suggestions for sessions the user has access to  
CREATE POLICY "Users can access suggestions for their sessions" 
ON public.conversation_suggestions 
FOR ALL 
USING (
  session_id IN (
    SELECT id FROM public.conversation_sessions 
    WHERE session_token = current_setting('app.session_token', true)
  )
);

-- 6. Add data retention - automatically delete conversations older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_conversations()
RETURNS void AS $$
BEGIN
  DELETE FROM public.conversation_messages 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM public.conversation_sessions 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM public.conversation_suggestions 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create index for better performance on session token lookups
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_token ON public.conversation_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_id ON public.conversation_messages(session_id);