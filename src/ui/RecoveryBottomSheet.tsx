import React from 'react';
import { useRecovery } from '../react/useRecovery';
import { RecoveryBannerRenderProps } from './RecoveryBanner';

export interface RecoveryBottomSheetProps<T = any> {
  journeyId: string;
  title?: string;
  message?: string;
  resumeLabel?: string;
  discardLabel?: string;
  onRestored?: (data: T) => void;
  onDiscarded?: () => void;
  render?: (props: RecoveryBannerRenderProps<T>) => React.ReactNode;
  overlayStyle?: React.CSSProperties;
  sheetStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  messageStyle?: React.CSSProperties;
  resumeButtonStyle?: React.CSSProperties;
  discardButtonStyle?: React.CSSProperties;
}

/**
 * Bottom-anchored sheet prompt for mobile and mobile-web viewports.
 * Slides up from the bottom with a drag pill indicator.
 */
export function RecoveryBottomSheet<T = any>({
  journeyId,
  title = 'Resume where you left off?',
  message,
  resumeLabel = 'Resume',
  discardLabel = 'Start Over',
  onRestored,
  onDiscarded,
  render,
  overlayStyle,
  sheetStyle,
  titleStyle,
  messageStyle,
  resumeButtonStyle,
  discardButtonStyle,
}: RecoveryBottomSheetProps<T>): React.ReactElement | null {
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 9999,
    ...overlayStyle,
  };

  const defaultSheetStyle: React.CSSProperties = {
    backgroundColor: '#0f172a',
    borderTop: '1px solid #334155',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    padding: '16px 24px 32px 24px',
    width: '100%',
    maxWidth: '540px',
    boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.6)',
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...sheetStyle,
  };

  const handlePillStyle: React.CSSProperties = {
    width: '40px',
    height: '4px',
    backgroundColor: '#475569',
    borderRadius: '2px',
    marginBottom: '16px',
  };

  const defaultTitleStyle: React.CSSProperties = {
    margin: '0 0 6px 0',
    fontSize: '17px',
    fontWeight: 600,
    color: '#f8fafc',
    textAlign: 'center',
    ...titleStyle,
  };

  const defaultMessageStyle: React.CSSProperties = {
    margin: '0 0 20px 0',
    fontSize: '14px',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 1.4,
    ...messageStyle,
  };

  const defaultResumeButtonStyle: React.CSSProperties = {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 20px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
    ...resumeButtonStyle,
  };

  const defaultDiscardButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: 'none',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
    marginTop: '6px',
    ...discardButtonStyle,
  };

  return (
    <div
      style={defaultOverlayStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-sheet-title"
      data-testid="recovery-sheet-overlay"
    >
      <div style={defaultSheetStyle} data-testid="recovery-sheet-card">
        <div style={handlePillStyle} aria-hidden="true" />
        <h3 id="recovery-sheet-title" style={defaultTitleStyle}>
          {title}
        </h3>
        <p style={defaultMessageStyle}>
          {message ??
            (formattedLastSaved
              ? `You left off at ${formattedLastSaved}. Would you like to resume your progress?`
              : 'Would you like to resume your unfinished progress?')}
        </p>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            type="button"
            onClick={handleRestore}
            style={defaultResumeButtonStyle}
            data-testid="recovery-sheet-resume"
          >
            {resumeLabel}
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            style={defaultDiscardButtonStyle}
            data-testid="recovery-sheet-discard"
          >
            {discardLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

