import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

describe('MemoryStorageAdapter', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  it('sets, gets, and removes values correctly', async () => {
    expect(await storage.getItem('test_key')).toBeNull();

    await storage.setItem('test_key', 'test_value');
    expect(await storage.getItem('test_key')).toBe('test_value');

    await storage.removeItem('test_key');
    expect(await storage.getItem('test_key')).toBeNull();
  });

  it('returns all keys correctly', async () => {
    await storage.setItem('k1', 'v1');
    await storage.setItem('k2', 'v2');
    const keys = await storage.getAllKeys();
    expect(keys).toEqual(expect.arrayContaining(['k1', 'k2']));
    expect(keys.length).toBe(2);
  });

  it('clears storage completely', async () => {
    await storage.setItem('k1', 'v1');
    await storage.clear();
    expect(await storage.getItem('k1')).toBeNull();
    const keys = await storage.getAllKeys();
    expect(keys.length).toBe(0);
  });
});
