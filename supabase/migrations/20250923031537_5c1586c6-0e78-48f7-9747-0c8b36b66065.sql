-- Fix rate_limits table security vulnerability
-- Replace the overly permissive policy with secure access control

-- Drop the existing insecure policy
DROP POLICY IF EXISTS "Allow edge functions to manage rate limits" ON public.rate_limits;

-- Create a secure policy that only allows access to service role
-- This ensures only edge functions and system processes can access rate limiting data
CREATE POLICY "Service role can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (current_setting('role') = 'service_role');

-- Create a security definer function for edge functions to safely manage rate limits
-- This provides a controlled interface for rate limiting operations
CREATE OR REPLACE FUNCTION public.manage_rate_limit(
  p_identifier text,
  p_max_requests integer DEFAULT 20,
  p_window_minutes integer DEFAULT 10
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  window_start_time timestamp with time zone;
BEGIN
  -- Calculate the window start time
  window_start_time := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Clean up old entries first
  DELETE FROM public.rate_limits 
  WHERE identifier = p_identifier 
  AND window_start < window_start_time;
  
  -- Get current request count for this identifier
  SELECT COALESCE(SUM(request_count), 0) 
  INTO current_count
  FROM public.rate_limits 
  WHERE identifier = p_identifier 
  AND window_start >= window_start_time;
  
  -- Check if rate limit is exceeded
  IF current_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Insert or update rate limit entry
  INSERT INTO public.rate_limits (identifier, request_count, window_start)
  VALUES (p_identifier, 1, now())
  ON CONFLICT (identifier) 
  DO UPDATE SET 
    request_count = rate_limits.request_count + 1,
    window_start = CASE 
      WHEN rate_limits.window_start < window_start_time THEN now()
      ELSE rate_limits.window_start
    END;
  
  RETURN true;
END;
$$;

-- Grant execute permission to service role for the function
GRANT EXECUTE ON FUNCTION public.manage_rate_limit TO service_role;