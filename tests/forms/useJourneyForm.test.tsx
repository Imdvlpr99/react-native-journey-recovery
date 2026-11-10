import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RecoveryProvider } from '../../src/react/RecoveryProvider';
import { useJourneyForm, FormLike } from '../../src/forms/useJourneyForm';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';
import { CheckpointManager } from '../../src/core/CheckpointManager';

describe('useJourneyForm (Form Integration)', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <RecoveryProvider storage={storage}>{children}</RecoveryProvider>
    );
  };

  it('watches form changes and automatically persists checkpoints', async () => {
    let watchCallback: ((values: any) => void) | null = null;
    let formValues = { email: '', name: '' };

    const mockForm: FormLike<typeof formValues> = {
      getValues: vi.fn(() => formValues),
      watch: vi.fn((cb: (values: any) => void) => {
        watchCallback = cb;
        return { unsubscribe: vi.fn() };
      }),
      reset: vi.fn((values) => {
        if (values) formValues = values as any;
      }),
    };

    renderHook(
      () =>
        useJourneyForm('signup-form', mockForm, {
          autoSave: false, // Save immediately for test
        }),
      { wrapper: createWrapper() }
    );

    expect(mockForm.watch).toHaveBeenCalled();

    // User types in form
    await act(async () => {
      watchCallback!({ email: 'user@example.com', name: 'John' });
      await new Promise((r) => setTimeout(r, 10));
    });

    const stored = await storage.getItem('@rn_journey:signup-form');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).data).toEqual({
      email: 'user@example.com',
      name: 'John',
    });
  });

  it('restores checkpointed data directly into form via restoreToForm', async () => {
    const cpManager = new CheckpointManager(storage);
    await cpManager.save(
      'profile-form',
      { bio: 'React Native Dev', website: 'https://example.com' },
      { version: 1 }
    );

    let formValues = { bio: '', website: '' };
    const mockForm: FormLike<typeof formValues> = {
      getValues: vi.fn(() => formValues),
      watch: vi.fn(() => ({ unsubscribe: vi.fn() })),
      reset: vi.fn((values) => {
        if (values) formValues = values as any;
      }),
    };

    const { result } = renderHook(
      () => useJourneyForm('profile-form', mockForm),
      { wrapper: createWrapper() }
    );

    // Wait for recovery check
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.hasSavedProgress).toBe(true);

    await act(async () => {
      await result.current.restoreToForm();
    });

    expect(mockForm.reset).toHaveBeenCalledWith({
      bio: 'React Native Dev',
      website: 'https://example.com',
    });
  });
});

