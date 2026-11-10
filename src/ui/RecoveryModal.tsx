import React from 'react';
import { useRecovery } from '../react/useRecovery';
import { RecoveryBannerRenderProps } from './RecoveryBanner';

export interface RecoveryModalProps<T = any> {
  journeyId: string;
  title?: string;
  message?: string;
  resumeLabel?: string;
  discardLabel?: string;
  onRestored?: (data: T) => void;
  onDiscarded?: () => void;
  render?: (props: RecoveryBannerRenderProps<T>) => React.ReactNode;
  overlayStyle?: React.CSSProperties;
  modalStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  messageStyle?: React.CSSProperties;
  resumeButtonStyle?: React.CSSProperties;
  discardButtonStyle?: React.CSSProperties;
}

/**
 * Centered modal dialog prompt for offering users the choice to resume
 * an interrupted journey or discard it with clean dismissal.
 */
export function RecoveryModal<T = any>({
  journeyId,
  title = 'Resume where you left off?',
  message,
  resumeLabel = 'Resume',
  discardLabel = 'Start Over',
  onRestored,
  onDiscarded,
  render,
  overlayStyle,
  modalStyle,
  titleStyle,
  messageStyle,
  resumeButtonStyle,
  discardButtonStyle,
}: RecoveryModalProps<T>): React.ReactElement | null {
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

  if (!recovery.available || recovery.status !== 'available') {
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

  const defaultOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
    backdropFilter: 'blur(4px)',
    ...overlayStyle,
  };

  const defaultModalStyle: React.CSSProperties = {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    ...modalStyle,
  };

  const defaultTitleStyle: React.CSSProperties = {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    ...titleStyle,
  };

  const defaultMessageStyle: React.CSSProperties = {
    margin: '0 0 20px 0',
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: 1.5,
    ...messageStyle,
  };

  const defaultResumeButtonStyle: React.CSSProperties = {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    ...resumeButtonStyle,
  };

  const defaultDiscardButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #475569',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    ...discardButtonStyle,
  };

  return (
    <div
      style={defaultOverlayStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-modal-title"
      data-testid="recovery-modal-overlay"
    >
      <div style={defaultModalStyle} data-testid="recovery-modal-card">
        <h3 id="recovery-modal-title" style={defaultTitleStyle}>
          <span>🔄</span> {title}
        </h3>
        <p style={defaultMessageStyle}>
          {message ??
            (formattedLastSaved
              ? `You have an unfinished session from ${formattedLastSaved}. Would you like to resume where you left off?`
              : 'You have an unfinished session. Would you like to resume where you left off?')}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={handleDiscard}
            style={defaultDiscardButtonStyle}
            data-testid="recovery-modal-discard"
          >
            {discardLabel}
          </button>
          <button
            type="button"
            onClick={handleRestore}
            style={defaultResumeButtonStyle}
            data-testid="recovery-modal-resume"
          >
            {resumeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

