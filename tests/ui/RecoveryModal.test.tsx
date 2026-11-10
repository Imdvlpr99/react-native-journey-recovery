import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RecoveryProvider } from '../../src/react/RecoveryProvider';
import { RecoveryModal } from '../../src/ui/RecoveryModal';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

describe('RecoveryModal UI Component', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <RecoveryProvider storage={storage}>{children}</RecoveryProvider>
    );
  };

  it('renders nothing when no checkpoint exists', async () => {
    const { container } = render(<RecoveryModal journeyId="checkout" />, {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(container.firstChild).toBeNull();
  });

  it('renders modal with backdrop overlay, title, and buttons when checkpoint exists', async () => {
    const cpManager = new CheckpointManager(storage);
    await cpManager.save('checkout', { step: 'shipping' }, { version: 1 });

    const onRestored = vi.fn();
    const onDiscarded = vi.fn();

    render(
      <RecoveryModal
        journeyId="checkout"
        title="Resume checkout modal?"
        onRestored={onRestored}
        onDiscarded={onDiscarded}
      />,
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(screen.getByTestId('recovery-modal-overlay')).toBeDefined();
    expect(screen.getByTestId('recovery-modal-card')).toBeDefined();
    expect(screen.getByText('Resume')).toBeDefined();
    expect(screen.getByText('Start Over')).toBeDefined();

    // Click resume
    await act(async () => {
      fireEvent.click(screen.getByTestId('recovery-modal-resume'));
    });

    expect(onRestored).toHaveBeenCalledWith({ step: 'shipping' });
  });

  it('handles discard action cleanly and triggers onDiscarded callback', async () => {
    const cpManager = new CheckpointManager(storage);
    await cpManager.save('checkout', { step: 'billing' }, { version: 1 });

    const onDiscarded = vi.fn();

    render(
      <RecoveryModal
        journeyId="checkout"
        onDiscarded={onDiscarded}
      />,
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('recovery-modal-discard'));
    });

    expect(onDiscarded).toHaveBeenCalled();
  });
});

