import { describe, it, expect, vi } from 'vitest';
import { AsyncStorageAdapter } from '../../src/storage/AsyncStorageAdapter';
import { JourneyRecoveryError } from '../../src/utils/errors';

describe('AsyncStorageAdapter', () => {
  it('delegates getItem, setItem, removeItem and getAllKeys to underlying client', async () => {
    const mockClient = {
      getItem: vi.fn().mockResolvedValue('stored_data'),
      setItem: vi.fn().mockResolvedValue(undefined),
      removeItem: vi.fn().mockResolvedValue(undefined),
      getAllKeys: vi.fn().mockResolvedValue(['journey_1', 'journey_2']),
    };

    const adapter = new AsyncStorageAdapter(mockClient);

    const val = await adapter.getItem('journey_1');
    expect(val).toBe('stored_data');
    expect(mockClient.getItem).toHaveBeenCalledWith('journey_1');

    await adapter.setItem('journey_1', 'new_data');
    expect(mockClient.setItem).toHaveBeenCalledWith('journey_1', 'new_data');

    await adapter.removeItem('journey_1');
    expect(mockClient.removeItem).toHaveBeenCalledWith('journey_1');

    const keys = await adapter.getAllKeys();
    expect(keys).toEqual(['journey_1', 'journey_2']);
  });

  it('wraps underlying storage errors with JourneyRecoveryError STORAGE_UNAVAILABLE', async () => {
    const mockClient = {
      getItem: vi.fn().mockRejectedValue(new Error('Native storage failure')),
      setItem: vi.fn().mockRejectedValue(new Error('Write failed')),
      removeItem: vi.fn().mockRejectedValue(new Error('Delete failed')),
    };

    const adapter = new AsyncStorageAdapter(mockClient);

    await expect(adapter.getItem('key')).rejects.toThrow(JourneyRecoveryError);
    await expect(adapter.getItem('key')).rejects.toMatchObject({
      code: 'STORAGE_UNAVAILABLE',
    });

    await expect(adapter.setItem('key', 'val')).rejects.toThrow(JourneyRecoveryError);
    await expect(adapter.setItem('key', 'val')).rejects.toMatchObject({
      code: 'STORAGE_UNAVAILABLE',
    });

    await expect(adapter.removeItem('key')).rejects.toThrow(JourneyRecoveryError);
    await expect(adapter.removeItem('key')).rejects.toMatchObject({
      code: 'STORAGE_UNAVAILABLE',
    });
  });
});
