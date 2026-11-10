import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecoveryProvider } from '../../src/react/RecoveryProvider';
import { useRecoveryContext } from '../../src/react/RecoveryContext';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

function TestChild() {
  const ctx = useRecoveryContext();
  return <div data-testid="ready">{ctx ? 'context-ready' : 'no-context'}</div>;
}

describe('RecoveryProvider', () => {
  it('provides recovery context to children', () => {
    const storage = new MemoryStorageAdapter();

    render(
      <RecoveryProvider storage={storage}>
        <TestChild />
      </RecoveryProvider>
    );

    expect(screen.getByTestId('ready').textContent).toBe('context-ready');
  });

  it('throws error when hooks are used outside RecoveryProvider', () => {
    expect(() => render(<TestChild />)).toThrow(
      'useRecoveryContext must be used within a RecoveryProvider'
    );
  });
});
