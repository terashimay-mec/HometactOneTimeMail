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

  const clearEmailFromQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('email');
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, router]);

  const validateEmailAddress = useCallback((email: string): boolean => {
    // システムで生成するメールアドレスのフォーマット: YYMMDDNNN@otm.mec.mejsh.com
    const emailRegex = /^(\d{6})(\d{3})@otm\.mec\.mejsh\.com$/;
    const match = email.match(emailRegex);
    
    if (!match) {
      return false; // フォーマットが正しくない
    }
    
    const datePart = match[1]; // YYMMDD
    const today = new Date();
    const todayStr = today.getFullYear().toString().slice(-2) + 
                    (today.getMonth() + 1).toString().padStart(2, '0') + 
                    today.getDate().toString().padStart(2, '0');
    
    return datePart === todayStr; // 今日の日付かチェック
  }, []);

  const getValidatedEmailFromQuery = useCallback((): string | null => {
    const email = getEmailFromQuery();
    
    if (!email) {
      return null;
    }
    
    const isValid = validateEmailAddress(email);
    
    if (!isValid) {
      router.push('/');
      return null;
    }
    
    return email;
  }, [getEmailFromQuery, validateEmailAddress, router]);

  return {
    getEmailFromQuery,
    getValidatedEmailFromQuery,
    setEmailToQuery,
    clearEmailFromQuery,
    validateEmailAddress
  };
}
