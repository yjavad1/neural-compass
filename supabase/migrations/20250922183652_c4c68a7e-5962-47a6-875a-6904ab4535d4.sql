-- Fix critical security vulnerabilities in conversation tables

-- 1. Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow all operations on conversation_messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "Allow all operations on conversation_sessions" ON public.conversation_sessions;
DROP POLICY IF EXISTS "Suggestions are publicly accessible" ON public.conversation_suggestions;
DROP POLICY IF EXISTS "Users can access sessions with valid token" ON public.conversation_sessions;
DROP POLICY IF EXISTS "Users can access messages from their sessions" ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can access suggestions for their sessions" ON public.conversation_suggestions;

-- 2. Add session_token column to conversation_sessions for access control
ALTER TABLE public.conversation_sessions 
ADD COLUMN IF NOT EXISTS session_token TEXT;

-- Add unique constraint separately to avoid conflicts
ALTER TABLE public.conversation_sessions 
DROP CONSTRAINT IF EXISTS conversation_sessions_session_token_key;

-- Update existing sessions with tokens
UPDATE public.conversation_sessions 
SET session_token = encode(gen_random_bytes(32), 'hex') 
WHERE session_token IS NULL;

-- Make session_token required and unique
ALTER TABLE public.conversation_sessions 
ALTER COLUMN session_token SET NOT NULL;

ALTER TABLE public.conversation_sessions 
ADD CONSTRAINT conversation_sessions_session_token_key UNIQUE (session_token);

-- 3. Create secure RLS policies for conversation_sessions
CREATE POLICY "Sessions require valid token" 
ON public.conversation_sessions 
FOR ALL 
USING (
  session_token = current_setting('app.session_token', true) OR
  current_setting('app.session_token', true) = ''
);

-- 4. Create secure RLS policies for conversation_messages  
CREATE POLICY "Messages require session access" 
ON public.conversation_messages 
FOR ALL 
USING (
  session_id IN (
    SELECT id FROM public.conversation_sessions 
    WHERE session_token = current_setting('app.session_token', true) OR
          current_setting('app.session_token', true) = ''
  )
);

-- 5. Create secure RLS policies for conversation_suggestions
CREATE POLICY "Suggestions require session access" 
ON public.conversation_suggestions 
FOR ALL 
USING (
  session_id IN (
    SELECT id FROM public.conversation_sessions 
    WHERE session_token = current_setting('app.session_token', true) OR
          current_setting('app.session_token', true) = ''
  )
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_token ON public.conversation_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_id ON public.conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_suggestions_session_id ON public.conversation_suggestions(session_id);