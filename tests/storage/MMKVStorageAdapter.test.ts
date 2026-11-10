import { describe, it, expect, vi } from 'vitest';
import { MMKVStorageAdapter, MMKVLike } from '../../src/storage/MMKVStorageAdapter';
import { JourneyRecoveryError } from '../../src/utils/errors';

describe('MMKVStorageAdapter', () => {
  it('reads, writes, and deletes values with MMKV client instance', async () => {
    const mockStore = new Map<string, string>();
    const mockMMKV: MMKVLike = {
      getString: vi.fn((key: string) => mockStore.get(key)),
      set: vi.fn((key: string, val: string) => {
        mockStore.set(key, val);
      }),
      delete: vi.fn((key: string) => {
        mockStore.delete(key);
      }),
      getAllKeys: vi.fn(() => Array.from(mockStore.keys())),
    };

    const adapter = new MMKVStorageAdapter(mockMMKV);

    expect(await adapter.getItem('key_1')).toBeNull();

    await adapter.setItem('key_1', 'val_1');
    expect(mockMMKV.set).toHaveBeenCalledWith('key_1', 'val_1');
    expect(await adapter.getItem('key_1')).toBe('val_1');

    const keys = await adapter.getAllKeys();
    expect(keys).toEqual(['key_1']);

    await adapter.removeItem('key_1');
    expect(mockMMKV.delete).toHaveBeenCalledWith('key_1');
    expect(await adapter.getItem('key_1')).toBeNull();
  });

  it('wraps MMKV native exceptions with STORAGE_UNAVAILABLE', async () => {
    const mockMMKV: MMKVLike = {
      getString: vi.fn(() => {
        throw new Error('MMKV native error');
      }),
      set: vi.fn(() => {
        throw new Error('MMKV disk error');
      }),
      delete: vi.fn(() => {
        throw new Error('MMKV error');
      }),
      getAllKeys: vi.fn(() => {
        throw new Error('MMKV error');
      }),
    };

    const adapter = new MMKVStorageAdapter(mockMMKV);

    await expect(adapter.getItem('k')).rejects.toThrow(JourneyRecoveryError);
    await expect(adapter.setItem('k', 'v')).rejects.toThrow(JourneyRecoveryError);
    await expect(adapter.removeItem('k')).rejects.toThrow(JourneyRecoveryError);
    await expect(adapter.getAllKeys()).rejects.toThrow(JourneyRecoveryError);
  });
});

