'use client';

import { useRef, useCallback } from 'react';
import { checkS3Emails } from '@/app/actions/email-actions';
import { Email } from '@/types';

export function useS3Checker() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startChecking = useCallback(async (
    emailAddress: string, 
    onEmailsUpdate: (emails: Email[]) => void
  ) => {
    // 即座にチェック
    try {
      const emails = await checkS3Emails(emailAddress);
      onEmailsUpdate(emails);
    } catch (error) {
      console.error('Failed to check S3 emails:', error);
    }

    // 30秒間隔でチェック
    intervalRef.current = setInterval(async () => {
      try {
        const emails = await checkS3Emails(emailAddress);
        onEmailsUpdate(emails);
      } catch (error) {
        console.error('Failed to check S3 emails:', error);
      }
    }, 30000);
  }, []);

  const stopChecking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return {
    startChecking,
    stopChecking
  };
}
