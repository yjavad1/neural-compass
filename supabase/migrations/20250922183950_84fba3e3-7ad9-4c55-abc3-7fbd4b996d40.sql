-- Create a scheduled cleanup trigger for data retention
-- This will automatically clean up old conversation data

-- Create a trigger function that runs cleanup periodically
CREATE OR REPLACE FUNCTION public.trigger_cleanup_old_conversations()
RETURNS trigger AS $$
BEGIN
  -- Only run cleanup occasionally to avoid performance impact
  IF random() < 0.01 THEN -- 1% chance on each insert
    PERFORM public.cleanup_old_conversations();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger that runs cleanup when new conversations are created
DROP TRIGGER IF EXISTS auto_cleanup_trigger ON public.conversation_sessions;
CREATE TRIGGER auto_cleanup_trigger
  AFTER INSERT ON public.conversation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_cleanup_old_conversations();