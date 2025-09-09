'use client';

import { useState, useCallback } from 'react';
import { Email } from '@/types';

export function useEmailList() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshEmails = useCallback(async (newEmails: Email[]) => {
    setLoading(true);
    setError(null);
    
    try {
      setEmails(newEmails);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to refresh emails:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    emails,
    loading,
    error,
    refreshEmails
  };
}
