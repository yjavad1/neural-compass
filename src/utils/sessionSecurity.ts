import { supabase } from '@/integrations/supabase/client';

/**
 * Session security utilities for managing secure access to conversation data
 * The session token ensures users can only access their own conversation data
 */

/**
 * Sets the session token in the Supabase client for RLS access control
 * This ensures all database operations are properly scoped to the user's session
 */
export const setSessionToken = async (token: string) => {
  try {
    // Set the session token in the database session for RLS policies
    const { error } = await supabase.rpc('set_config', {
      setting_name: 'app.session_token',
      setting_value: token
    });
    
    if (error) {
      console.warn('Failed to set session token for RLS:', error);
    }
  } catch (error) {
    console.warn('Error setting session token:', error);
  }
};

/**
 * Clears the session token from the Supabase client
 */
export const clearSessionToken = async () => {
  try {
    const { error } = await supabase.rpc('set_config', {
      setting_name: 'app.session_token', 
      setting_value: ''
    });
    
    if (error) {
      console.warn('Failed to clear session token:', error);
    }
  } catch (error) {
    console.warn('Error clearing session token:', error);
  }
};