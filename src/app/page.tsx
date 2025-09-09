'use client';

import { useEffect } from 'react';
import { EmailGenerator } from '@/components/EmailGenerator';
import { EmailList } from '@/components/EmailList';
import { useEmailAddress } from '@/hooks/useEmailAddress';
import { useEmailList } from '@/hooks/useEmailList';
import { useS3Checker } from '@/hooks/useS3Checker';
import { useEmailFromQuery } from '@/hooks/useEmailFromQuery';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

// Amplify設定を初期化
Amplify.configure(outputs);

export default function HomePage() {
  const { emailAddress, generateEmailAddress, loading: addressLoading, error: addressError } = useEmailAddress();
  const { emails, refreshEmails, loading: emailsLoading, error: emailsError } = useEmailList();
  const { startChecking, stopChecking } = useS3Checker();
  const { getEmailFromQuery } = useEmailFromQuery();

  // ページ読み込み時にメールアドレス生成（クエリパラメータにない場合のみ）
  useEffect(() => {
    const queryEmail = getEmailFromQuery();
    if (!queryEmail) {
      generateEmailAddress();
    }
  }, [generateEmailAddress, getEmailFromQuery]);

  // メールアドレスが生成されたらS3チェック開始
  useEffect(() => {
    if (emailAddress?.address) {
      startChecking(emailAddress.address, refreshEmails);
    }
    
    return () => {
      stopChecking();
    };
  }, [emailAddress?.address, startChecking, stopChecking, refreshEmails]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <EmailGenerator 
            emailAddress={emailAddress} 
            loading={addressLoading}
            error={addressError}
            onRetry={generateEmailAddress}
          />
          
          <EmailList 
            emails={emails} 
            loading={emailsLoading}
            error={emailsError}
            onRetry={() => {
              if (emailAddress?.address) {
                startChecking(emailAddress.address, refreshEmails);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
