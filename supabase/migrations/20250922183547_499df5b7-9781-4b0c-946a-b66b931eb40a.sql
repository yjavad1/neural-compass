-- Fix function search path security warning
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;