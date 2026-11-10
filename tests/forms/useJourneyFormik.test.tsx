import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RecoveryProvider } from '../../src/react/RecoveryProvider';
import { useJourneyFormik, FormikLike } from '../../src/forms/useJourneyFormik';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';
import { CheckpointManager } from '../../src/core/CheckpointManager';

describe('useJourneyFormik (Formik Integration)', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <RecoveryProvider storage={storage}>{children}</RecoveryProvider>
    );
  };

  it('synchronizes Formik values into checkpoints when values update', async () => {
    let formikState = {
      values: { email: '', name: '' },
      setValues: vi.fn((vals) => {
        formikState.values = vals;
      }),
      resetForm: vi.fn(() => {
        formikState.values = { email: '', name: '' };
      }),
      dirty: false,
      isValid: true,
    };

    const { rerender } = renderHook(
      ({ formik }: { formik: FormikLike<typeof formikState.values> }) =>
        useJourneyFormik('formik-signup', formik, {
          autoSave: false, // Save immediately for test
        }),
      {
        wrapper: createWrapper(),
        initialProps: { formik: formikState },
      }
    );

    // Form values change (e.g., user input)
    formikState = {
      ...formikState,
      values: { email: 'formik.user@example.com', name: 'Alice' },
      dirty: true,
    };

    await act(async () => {
      rerender({ formik: formikState });
      await new Promise((r) => setTimeout(r, 20));
    });

    const stored = await storage.getItem('@rn_journey:formik-signup');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.data).toEqual({
      email: 'formik.user@example.com',
      name: 'Alice',
    });
  });

  it('restores checkpointed state directly into Formik via restoreToFormik', async () => {
    const cpManager = new CheckpointManager(storage);
    await cpManager.save(
      'formik-profile',
      { company: 'Acme Corp', role: 'Staff Engineer' },
      { version: 1 }
    );

    let formikState = {
      values: { company: '', role: '' },
      setValues: vi.fn((vals) => {
        formikState.values = vals;
      }),
      resetForm: vi.fn(),
    };

    const { result } = renderHook(
      () => useJourneyFormik('formik-profile', formikState),
      { wrapper: createWrapper() }
    );

    // Wait for recovery check
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.hasSavedProgress).toBe(true);

    let restored: any;
    await act(async () => {
      restored = await result.current.restoreToFormik();
    });

    expect(restored).toEqual({ company: 'Acme Corp', role: 'Staff Engineer' });
    expect(formikState.setValues).toHaveBeenCalledWith({
      company: 'Acme Corp',
      role: 'Staff Engineer',
    });
  });

  it('supports clearFormik to purge stored checkpoint and reset Formik state', async () => {
    const cpManager = new CheckpointManager(storage);
    await cpManager.save('formik-clear', { field: 'value' });

    let formikState = {
      values: { field: 'value' },
      setValues: vi.fn(),
      resetForm: vi.fn(),
    };

    const { result } = renderHook(
      () => useJourneyFormik('formik-clear', formikState),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.clearFormik();
    });

    const stored = await storage.getItem('@rn_journey:formik-clear');
    expect(stored).toBeNull();
    expect(formikState.resetForm).toHaveBeenCalled();
  });

  it('supports manual checkpointFormik with field exclusion', async () => {
    let formikState = {
      values: { username: 'testuser', password: 'secretpassword123' },
      setValues: vi.fn(),
      resetForm: vi.fn(),
    };

    const { result } = renderHook(
      () =>
        useJourneyFormik('formik-manual', formikState, {
          autoSave: false,
          exclude: ['password'],
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.checkpointFormik();
    });

    const stored = await storage.getItem('@rn_journey:formik-manual');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.data.username).toBe('testuser');
    expect(parsed.data.password).toBeUndefined();
  });
});
