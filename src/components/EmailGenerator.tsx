'use client';

import { useState } from 'react';
import { CopyButton } from './CopyButton';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { EmailAddress } from '@/types';

interface EmailGeneratorProps {
  emailAddress: EmailAddress | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function EmailGenerator({ emailAddress, loading, error, onRetry }: EmailGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (emailAddress?.address) {
      try {
        await navigator.clipboard.writeText(emailAddress.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2">生成中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <ErrorMessage message={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4 px-0">HOMETACT設定用メールアドレス</h2>
      
      {emailAddress ? (
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={emailAddress.address}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
            />
          </div>
          
          <div className="flex justify-end">
            <CopyButton 
              onCopy={handleCopy}
              copied={copied}
            />
          </div>
          
          <div className="text-sm text-gray-600">
            <p>作成日時: {emailAddress.createdAt ? new Date(emailAddress.createdAt).toLocaleString('ja-JP') : '不明'}</p>
            <p className="text-xs text-gray-500 mt-1">
              このアドレスは画面を閉じると使用できなくなります
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          メールアドレスの生成に失敗しました
        </div>
      )}
    </div>
  );
}
