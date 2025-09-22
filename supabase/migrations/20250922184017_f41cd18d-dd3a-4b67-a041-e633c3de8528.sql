-- Fix security warning by setting search path
CREATE OR REPLACE FUNCTION public.set_config(setting_name text, setting_value text)
RETURNS void AS $$
BEGIN
  PERFORM set_config(setting_name, setting_value, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add rate limiting table to prevent abuse
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on rate limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for rate limits (public access for edge functions)
CREATE POLICY "Allow edge functions to manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);