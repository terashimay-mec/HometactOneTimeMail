'use client';

interface CopyButtonProps {
  onCopy: () => void;
  copied: boolean;
}

export function CopyButton({ onCopy, copied }: CopyButtonProps) {
  return (
    <button
      onClick={onCopy}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        copied
          ? 'bg-green-500 text-white'
          : 'text-white hover:opacity-90'
      }`}
      style={{
        backgroundColor: copied ? undefined : '#dc000c'
      }}
    >
      {copied ? '✓ コピー完了' : 'コピー'}
    </button>
  );
}
