'use client';

import { useEffect, Suspense, useRef } from 'react';
import { EmailGenerator } from '@/components/EmailGenerator';
import { EmailList } from '@/components/EmailList';
import { Logo } from '@/components/Logo';
import { useEmailAddress } from '@/hooks/useEmailAddress';
import { useEmailList } from '@/hooks/useEmailList';
import { useS3Checker } from '@/hooks/useS3Checker';
import { useEmailFromQuery } from '@/hooks/useEmailFromQuery';
import { UpdateButtonRef } from '@/components/UpdateButton';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

// Amplify設定を初期化
Amplify.configure(outputs);

function HomePageContent() {
  const { emailAddress, generateEmailAddress, loading: addressLoading, error: addressError } = useEmailAddress();
  const { emails, refreshEmails, loading: emailsLoading, error: emailsError } = useEmailList();
  const { updateEmails, isUpdating, canUpdate, getRemainingCooldown } = useS3Checker();
  const { getEmailFromQuery } = useEmailFromQuery();
  const updateButtonRef = useRef<UpdateButtonRef>(null);

  // ページ読み込み時にメールアドレス生成（クエリパラメータにない場合のみ）
  useEffect(() => {
    const queryEmail = getEmailFromQuery();
    if (!queryEmail) {
      generateEmailAddress();
    }
  }, [generateEmailAddress, getEmailFromQuery]);

  // メールアドレスが生成されたら初期表示後に自動で更新ボタンをクリック
  useEffect(() => {
    if (emailAddress?.address && !emailsLoading && !emailsError) {
      // 少し遅延させてから自動クリック
      const timer = setTimeout(() => {
        if (updateButtonRef.current) {
          updateButtonRef.current.click();
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [emailAddress?.address, emailsLoading, emailsError]);

  const handleUpdate = () => {
    if (emailAddress?.address) {
      updateEmails(emailAddress.address, refreshEmails);
    }
  };

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
            ref={updateButtonRef}
            emails={emails} 
            loading={emailsLoading}
            error={emailsError}
            onRetry={handleUpdate}
            onUpdate={handleUpdate}
            isUpdating={isUpdating}
            canUpdate={canUpdate}
            getRemainingCooldown={getRemainingCooldown}
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
