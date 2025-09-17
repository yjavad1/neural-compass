-- Add table for conversation suggestions cache
CREATE TABLE public.conversation_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  message_context TEXT NOT NULL,
  suggestions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (no authentication required for suggestions)
CREATE POLICY "Suggestions are publicly accessible" 
ON public.conversation_suggestions 
FOR ALL 
USING (true);

-- Add index for better performance
CREATE INDEX idx_conversation_suggestions_session_id ON public.conversation_suggestions(session_id);
CREATE INDEX idx_conversation_suggestions_created_at ON public.conversation_suggestions(created_at);