import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RecoveryProvider } from '../../src/react/RecoveryProvider';
import { RecoveryBanner } from '../../src/ui/RecoveryBanner';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

describe('RecoveryBanner UI Component', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <RecoveryProvider storage={storage}>{children}</RecoveryProvider>
    );
  };

  it('renders nothing when no saved checkpoint exists', async () => {
    const { container } = render(<RecoveryBanner journeyId="checkout" />, {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(container.firstChild).toBeNull();
  });

  it('renders recovery prompt with title, resume, and discard buttons when checkpoint exists', async () => {
    const cpManager = new CheckpointManager(storage);
    await cpManager.save('checkout', { total: 49 }, { version: 1 });

    const onRestored = vi.fn();
    const onDiscarded = vi.fn();

    render(
      <RecoveryBanner
        journeyId="checkout"
        title="Resume your order?"
        onRestored={onRestored}
        onDiscarded={onDiscarded}
      />,
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(screen.getByText('Resume your order?')).toBeDefined();
    expect(screen.getByText('Resume')).toBeDefined();
    expect(screen.getByText('Start Over')).toBeDefined();

    // Click resume
    await act(async () => {
      fireEvent.click(screen.getByText('Resume'));
    });

    expect(onRestored).toHaveBeenCalledWith({ total: 49 });
  });

  it('supports custom headless render prop', async () => {
    const cpManager = new CheckpointManager(storage);
    await cpManager.save('custom-flow', { page: 3 }, { version: 1 });

    render(
      <RecoveryBanner
        journeyId="custom-flow"
        render={({ available, data, onRestore }) =>
          available ? (
            <div>
              <p>Custom Prompt: Page {data?.page}</p>
              <button onClick={onRestore}>Custom Resume</button>
            </div>
          ) : null
        }
      />,
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(screen.getByText('Custom Prompt: Page 3')).toBeDefined();
  });
});
