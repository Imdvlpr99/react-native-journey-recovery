import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RecoveryProvider } from '../../src/react/RecoveryProvider';
import { RecoveryBottomSheet } from '../../src/ui/RecoveryBottomSheet';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

describe('RecoveryBottomSheet UI Component', () => {
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
    const { container } = render(<RecoveryBottomSheet journeyId="loan-application" />, {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(container.firstChild).toBeNull();
  });

  it('renders bottom sheet dialog when checkpoint exists', async () => {
    const cpManager = new CheckpointManager(storage);
    await cpManager.save('loan-application', { step: 3, amount: 25000 }, { version: 1 });

    const onRestored = vi.fn();
    const onDiscarded = vi.fn();

    render(
      <RecoveryBottomSheet
        journeyId="loan-application"
        title="Resume Loan Application"
        onRestored={onRestored}
        onDiscarded={onDiscarded}
      />,
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(screen.getByTestId('recovery-sheet-overlay')).toBeDefined();
    expect(screen.getByTestId('recovery-sheet-card')).toBeDefined();
    expect(screen.getByText('Resume Loan Application')).toBeDefined();

    // Click resume
    await act(async () => {
      fireEvent.click(screen.getByTestId('recovery-sheet-resume'));
    });

    expect(onRestored).toHaveBeenCalledWith({ step: 3, amount: 25000 });
  });

  it('discards checkpoint on discard click', async () => {
    const cpManager = new CheckpointManager(storage);
    await cpManager.save('loan-application', { step: 1 }, { version: 1 });

    const onDiscarded = vi.fn();

    render(
      <RecoveryBottomSheet
        journeyId="loan-application"
        onDiscarded={onDiscarded}
      />,
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('recovery-sheet-discard'));
    });

    expect(onDiscarded).toHaveBeenCalled();
  });
});

