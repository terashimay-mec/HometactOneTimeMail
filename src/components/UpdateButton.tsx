'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

interface UpdateButtonProps {
  onUpdate: () => void;
  isUpdating: boolean;
  canUpdate: () => boolean;
  getRemainingCooldown: () => number;
}

export interface UpdateButtonRef {
  click: () => void;
}

export const UpdateButton = forwardRef<UpdateButtonRef, UpdateButtonProps>(function UpdateButton({ onUpdate, isUpdating, canUpdate, getRemainingCooldown }, ref) {
  const [remainingTime, setRemainingTime] = useState(0);

  useImperativeHandle(ref, () => ({
    click: () => {
      if (canUpdate() && !isUpdating) {
        onUpdate();
      }
    }
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getRemainingCooldown();
      setRemainingTime(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [getRemainingCooldown]);

  const handleClick = () => {
    if (canUpdate() && !isUpdating) {
      onUpdate();
    }
  };

  const getButtonText = () => {
    if (isUpdating) {
      return '更新中...';
    }
    if (!canUpdate()) {
      return `更新可能まで ${Math.ceil(remainingTime / 1000)}秒`;
    }
    return '更新';
  };

  return (
    <button
      onClick={handleClick}
      disabled={!canUpdate() || isUpdating}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        canUpdate() && !isUpdating
          ? 'text-white hover:opacity-90'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
      style={{
        backgroundColor: canUpdate() && !isUpdating ? '#dc000c' : undefined
      }}
    >
      {getButtonText()}
    </button>
  );
});
