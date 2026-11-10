import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { RecoveryProvider } from '../../src/react/RecoveryProvider';
import { useJourney } from '../../src/react/useJourney';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

describe('RecoveryProvider AppState Lifecycle Integration', () => {
  it('flushes pending debounced auto-saves when app transitions to background', async () => {
    let appStateListener: ((state: string) => void) | null = null;
    const mockAppState = {
      addEventListener: vi.fn((_type: string, listener: (state: string) => void) => {
        appStateListener = listener;
        return { remove: vi.fn() };
      }),
    };

    const storage = new MemoryStorageAdapter();

    function FormComponent() {
      const journey = useJourney<{ input: string }>('form-flow', {
        autoSave: true,
        debounceMs: 5000, // Large debounce window
      });

      return (
        <button
          onClick={() => {
            journey.checkpoint({ input: 'unsaved draft' });
          }}
        >
          Type
        </button>
      );
    }

    const { getByText } = render(
      <RecoveryProvider
        storage={storage}
        options={{
          appState: mockAppState,
          flushOnBackground: true,
        }}
      >
        <FormComponent />
      </RecoveryProvider>
    );

    // Click to queue debounced write
    await act(async () => {
      getByText('Type').click();
    });

    // Checkpoint has NOT written immediately due to 5000ms debounce
    expect(await storage.getItem('@rn_journey:form-flow')).toBeNull();

    // Simulate AppState transitioning to background
    expect(appStateListener).not.toBeNull();
    await act(async () => {
      appStateListener!('background');
      await new Promise((r) => setTimeout(r, 20));
    });

    // Debounced write should have been immediately flushed!
    const stored = await storage.getItem('@rn_journey:form-flow');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).data).toEqual({ input: 'unsaved draft' });
  });
});
