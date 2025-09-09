'use client';

import { useState, forwardRef } from 'react';
import { EmailViewer } from './EmailViewer';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { UpdateButton, UpdateButtonRef } from './UpdateButton';
import { Email } from '@/types';

interface EmailListProps {
  emails: Email[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onUpdate: () => void;
  isUpdating: boolean;
  canUpdate: () => boolean;
  getRemainingCooldown: () => number;
}

export const EmailList = forwardRef<UpdateButtonRef, EmailListProps>(({ emails, loading, error, onRetry, onUpdate, isUpdating, canUpdate, getRemainingCooldown }, ref) => {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold px-0">受信メール</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold px-0">受信メール</h2>
        </div>
        <ErrorMessage message={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold px-0">
          受信メール ({emails.length}件)
        </h2>
        <UpdateButton
          ref={ref}
          onUpdate={onUpdate}
          isUpdating={isUpdating}
          canUpdate={canUpdate}
          getRemainingCooldown={getRemainingCooldown}
        />
      </div>
      
      {emails.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          受信メールはありません
        </div>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => (
            <div
              key={email.id}
              className="p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
              onClick={() => setSelectedEmail(email)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {email.from}
                  </div>
                  <div className="text-sm text-gray-600 truncate mt-1">
                    {email.subject || '(件名なし)'}
                  </div>
                </div>
                <div className="text-xs text-gray-500 ml-2">
                  {new Date(email.receivedAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedEmail && (
        <EmailViewer
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}
    </div>
  );
});
