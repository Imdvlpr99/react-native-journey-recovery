import React from 'react';
import { useRecovery } from '../react/useRecovery';

export interface RecoveryBannerRenderProps<T> {
  available: boolean;
  data: T | null;
  formattedLastSaved: string | null;
  onRestore: () => Promise<void>;
  onDiscard: () => Promise<void>;
  status: string;
}

export interface RecoveryBannerProps<T = any> {
  journeyId: string;
  title?: string;
  message?: string;
  resumeLabel?: string;
  discardLabel?: string;
  onRestored?: (data: T) => void;
  onDiscarded?: () => void;
  render?: (props: RecoveryBannerRenderProps<T>) => React.ReactNode;
  containerStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  messageStyle?: React.CSSProperties;
  resumeButtonStyle?: React.CSSProperties;
  discardButtonStyle?: React.CSSProperties;
}

/**
 * Headless and visual recovery prompt component for offering users the choice
 * to resume where they left off or discard interrupted progress.
 */
export function RecoveryBanner<T = any>({
  journeyId,
  title = 'Resume where you left off?',
  message,
  resumeLabel = 'Resume',
  discardLabel = 'Start Over',
  onRestored,
  onDiscarded,
  render,
  containerStyle,
  titleStyle,
  messageStyle,
  resumeButtonStyle,
  discardButtonStyle,
}: RecoveryBannerProps<T>): React.ReactElement | null {
  const recovery = useRecovery<T>(journeyId);

  const formattedLastSaved = recovery.snapshot?.updatedAt
    ? new Date(recovery.snapshot.updatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const handleRestore = async () => {
    const data = await recovery.restore();
    onRestored?.(data);
  };

  const handleDiscard = async () => {
    await recovery.discard();
    onDiscarded?.();
  };

  if (!recovery.available) {
    return null;
  }

  if (render) {
    return (
      <>
        {render({
          available: recovery.available,
          data: recovery.snapshot?.data ?? null,
          formattedLastSaved,
          onRestore: handleRestore,
          onDiscard: handleDiscard,
          status: recovery.status,
        })}
      </>
    );
  }

  return (
    <div
      style={{
        padding: '16px 20px',
        backgroundColor: '#f0f7ff',
        borderRadius: 8,
        border: '1px solid #cce3fd',
        marginBottom: 16,
        ...containerStyle,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 16, color: '#0958d9', ...titleStyle }}>
        {title}
      </div>
      {message && (
        <div style={{ fontSize: 14, color: '#4b5563', marginTop: 4, ...messageStyle }}>
          {message}
        </div>
      )}
      {formattedLastSaved && !message && (
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          Last saved at {formattedLastSaved}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button
          type="button"
          onClick={handleRestore}
          style={{
            backgroundColor: '#0958d9',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            ...resumeButtonStyle,
          }}
        >
          {resumeLabel}
        </button>
        <button
          type="button"
          onClick={handleDiscard}
          style={{
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            ...discardButtonStyle,
          }}
        >
          {discardLabel}
        </button>
      </div>
    </div>
  );
}
