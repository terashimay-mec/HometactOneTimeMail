'use client';

import { useState, useCallback, useEffect } from 'react';
import { EmailAddress } from '@/types';
import { createEmailAddress } from '@/app/actions/email-actions';
import { useEmailFromQuery } from './useEmailFromQuery';

export function useEmailAddress() {
  const [emailAddress, setEmailAddress] = useState<EmailAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getEmailFromQuery, setEmailToQuery } = useEmailFromQuery();

  // クエリパラメータからメールアドレスを取得
  useEffect(() => {
    const queryEmail = getEmailFromQuery();
    if (queryEmail) {
      // クエリパラメータから取得したメールアドレスを使用
      setEmailAddress({
        id: 'query-email',
        address: queryEmail,
        createdAt: new Date().toISOString(),
        isActive: true
      });
    }
  }, [getEmailFromQuery]);

  const generateEmailAddress = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createEmailAddress();
      console.log('createEmailAddress result:', result);
      if (result.success && result.data) {
        console.log('Setting email address:', result.data);
        setEmailAddress(result.data);
        // クエリパラメータにメールアドレスを設定
        setEmailToQuery(result.data.address);
      } else {
        setError(result.error || 'Failed to generate email address');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to generate email address:', err);
    } finally {
      setLoading(false);
    }
  }, [setEmailToQuery]);

  return {
    emailAddress,
    loading,
    error,
    generateEmailAddress
  };
}
