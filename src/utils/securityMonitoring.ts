import { supabase } from '@/integrations/supabase/client';

/**
 * Security monitoring and cleanup utilities
 */

/**
 * Cleans up old conversation data to protect user privacy
 * Removes conversations older than 30 days automatically
 */
export const cleanupOldData = async () => {
  try {
    const { error } = await supabase.rpc('cleanup_old_conversations');
    
    if (error) {
      console.warn('Failed to cleanup old conversations:', error);
    } else {
      console.log('Successfully cleaned up old conversation data');
    }
  } catch (error) {
    console.warn('Error during data cleanup:', error);
  }
};

/**
 * Validates that the current session token is properly set for security
 */
export const validateSessionSecurity = async (sessionToken: string) => {
  if (!sessionToken || sessionToken.length < 32) {
    console.warn('Invalid session token detected - security risk');
    return false;
  }
  return true;
};

/**
 * Monitors for potential security issues in conversation data
 */
export const monitorSecurityHealth = async () => {
  try {
    // Check for any conversations without proper session tokens
    const { data: orphanedSessions, error } = await supabase
      .from('conversation_sessions')
      .select('id')
      .is('session_token', null)
      .limit(1);

    if (error) {
      console.warn('Error checking security health:', error);
      return false;
    }

    if (orphanedSessions && orphanedSessions.length > 0) {
      console.warn('Security issue: Found sessions without tokens');
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Error during security monitoring:', error);
    return false;
  }
};