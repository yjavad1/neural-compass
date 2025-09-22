import { useState, useEffect } from 'react';

const SESSION_TOKEN_KEY = 'ai-career-session-token';

export const useSessionToken = () => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    // Try to get existing session token from localStorage
    const stored = localStorage.getItem(SESSION_TOKEN_KEY);
    if (stored) {
      setSessionToken(stored);
    }
  }, []);

  const storeSessionToken = (token: string) => {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    setSessionToken(token);
  };

  const clearSessionToken = () => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    setSessionToken(null);
  };

  return {
    sessionToken,
    storeSessionToken,
    clearSessionToken
  };
};