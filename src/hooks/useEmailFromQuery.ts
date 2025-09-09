'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useEmailFromQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const getEmailFromQuery = useCallback((): string | null => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      try {
        const decoded = Buffer.from(emailParam, 'base64').toString('utf-8');
        return decoded;
      } catch (error) {
        console.error('Failed to decode email from query:', error);
        return null;
      }
    }
    return null;
  }, [searchParams]);

  const setEmailToQuery = useCallback((email: string) => {
    try {
      const encoded = Buffer.from(email, 'utf-8').toString('base64');
      const params = new URLSearchParams(searchParams.toString());
      params.set('email', encoded);
      router.replace(`?${params.toString()}`, { scroll: false });
    } catch (error) {
      console.error('Failed to encode email for query:', error);
    }
  }, [searchParams, router]);

  return {
    getEmailFromQuery,
    setEmailToQuery
  };
}
