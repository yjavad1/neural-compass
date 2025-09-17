-- Add date_of_birth column to user_profiles for personalization
ALTER TABLE public.user_profiles ADD COLUMN date_of_birth date;

-- Add index for better suggestion queries performance  
CREATE INDEX idx_conversation_suggestions_session_created 
ON public.conversation_suggestions(session_id, created_at DESC);

-- Add index for message context to avoid duplicate suggestions
CREATE INDEX idx_conversation_suggestions_context 
ON public.conversation_suggestions USING hash(message_context);