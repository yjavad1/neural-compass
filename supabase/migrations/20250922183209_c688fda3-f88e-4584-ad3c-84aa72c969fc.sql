-- Drop the insecure policy that allows all operations
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON public.user_profiles;

-- Create secure RLS policies for user_profiles table
-- Users can only view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can only insert their own profile
CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.user_profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Make user_id column non-nullable for better security
ALTER TABLE public.user_profiles 
ALTER COLUMN user_id SET NOT NULL;