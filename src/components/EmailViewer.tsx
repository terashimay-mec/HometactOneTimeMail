'use client';

import { Email } from '@/types';

interface EmailViewerProps {
  email: Email;
  onClose: () => void;
}

export function EmailViewer({ email, onClose }: EmailViewerProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">メール詳細</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                送信者
              </label>
              <p className="mt-1 text-sm text-gray-900">{email.from}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                件名
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {email.subject || '(件名なし)'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                受信日時
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(email.receivedAt).toLocaleString()}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                本文
              </label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                  {email.body}
                </pre>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
