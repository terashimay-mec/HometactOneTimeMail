'use client';

import { useEffect, Suspense } from 'react';
import { EmailGenerator } from '@/components/EmailGenerator';
import { EmailList } from '@/components/EmailList';
import { Logo } from '@/components/Logo';
import { useEmailAddress } from '@/hooks/useEmailAddress';
import { useEmailList } from '@/hooks/useEmailList';
import { useS3Checker } from '@/hooks/useS3Checker';
import { useEmailFromQuery } from '@/hooks/useEmailFromQuery';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

// Amplify設定を初期化
Amplify.configure(outputs);

function HomePageContent() {
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
          {/* ロゴ表示 */}
          <div className="flex justify-center mb-8">
            <Logo className="h-8 w-auto" />
          </div>
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

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
