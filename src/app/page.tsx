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
  const { getValidatedEmailFromQuery } = useEmailFromQuery();
  const updateButtonRef = useRef<UpdateButtonRef>(null);

  // ページ読み込み時にメールアドレス生成（クエリパラメータにない場合のみ）
  useEffect(() => {
    const queryEmail = getValidatedEmailFromQuery();
    if (!queryEmail) {
      generateEmailAddress();
    }
  }, [generateEmailAddress, getValidatedEmailFromQuery]);

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
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* ロゴ表示 */}
            <div className="flex justify-center mb-8">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* メールアドレス生成カード */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="h-6 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-full mb-4 animate-pulse"></div>
              <div className="flex justify-end gap-2">
                <div className="h-10 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
            
            {/* 受信メールカード */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
