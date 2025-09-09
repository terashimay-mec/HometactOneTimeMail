'use client';

import { useRef, useCallback, useState } from 'react';
import { checkS3Emails } from '@/app/actions/email-actions';
import { Email } from '@/types';

export function useS3Checker() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const updateEmails = useCallback(async (
    emailAddress: string, 
    onEmailsUpdate: (emails: Email[]) => void
  ) => {
    // 10秒のクールダウン中は更新できない
    if (isUpdating || (lastUpdateTime && Date.now() - lastUpdateTime < 10000)) {
      return;
    }

    setIsUpdating(true);
    setLastUpdateTime(Date.now());

    try {
      const emails = await checkS3Emails(emailAddress);
      onEmailsUpdate(emails);
    } catch (error) {
      console.error('Failed to check S3 emails:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, lastUpdateTime]);

  const canUpdate = useCallback(() => {
    return !isUpdating && (!lastUpdateTime || Date.now() - lastUpdateTime >= 10000);
  }, [isUpdating, lastUpdateTime]);

  const getRemainingCooldown = useCallback(() => {
    if (!lastUpdateTime) return 0;
    const remaining = 10000 - (Date.now() - lastUpdateTime);
    return Math.max(0, remaining);
  }, [lastUpdateTime]);

  return {
    updateEmails,
    isUpdating,
    canUpdate,
    getRemainingCooldown
  };
}
