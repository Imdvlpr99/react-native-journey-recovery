import { describe, it, expect, vi } from 'vitest';
import { SecureStoreAdapter, SecureStoreLike } from '../../src/storage/SecureStoreAdapter';
import { JourneyRecoveryError } from '../../src/utils/errors';

describe('SecureStoreAdapter', () => {
  const createMockClient = () => {
    const store = new Map<string, string>();
    const client: SecureStoreLike = {
      getItemAsync: vi.fn(async (key: string) => store.get(key) ?? null),
      setItemAsync: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      deleteItemAsync: vi.fn(async (key: string) => {
        store.delete(key);
      }),
    };
    return { client, store };
  };

  it('saves, retrieves, and removes non-chunked values', async () => {
    const { client, store } = createMockClient();
    const adapter = new SecureStoreAdapter(client);

    await adapter.setItem('user_token', 'secret_value_123');
    expect(store.get('user_token')).toBe('secret_value_123');

    const result = await adapter.getItem('user_token');
    expect(result).toBe('secret_value_123');

    await adapter.removeItem('user_token');
    expect(store.has('user_token')).toBe(false);
    expect(await adapter.getItem('user_token')).toBeNull();
  });

  it('automatically chunks payloads exceeding chunkSize and reassembles them on getItem', async () => {
    const { client, store } = createMockClient();
    // Use a small chunk size of 50 bytes for testing
    const adapter = new SecureStoreAdapter(client, { chunkSize: 50 });

    const longPayload = 'A'.repeat(125); // Needs 3 chunks: 50 + 50 + 25
    await adapter.setItem('large_secure_journey', longPayload);

    // Verify manifest was written to main key
    const rawManifest = store.get('large_secure_journey');
    expect(rawManifest).toBeTruthy();
    const parsedManifest = JSON.parse(rawManifest!);
    expect(parsedManifest).toEqual({
      __isSecureChunked: true,
      totalChunks: 3,
    });

    // Verify individual chunks exist
    expect(store.get('large_secure_journey__c0')).toBe('A'.repeat(50));
    expect(store.get('large_secure_journey__c1')).toBe('A'.repeat(50));
    expect(store.get('large_secure_journey__c2')).toBe('A'.repeat(25));

    // Retrieve and verify full reassembly
    const retrieved = await adapter.getItem('large_secure_journey');
    expect(retrieved).toBe(longPayload);

    // Verify cleanup removes manifest and all chunks
    await adapter.removeItem('large_secure_journey');
    expect(store.has('large_secure_journey')).toBe(false);
    expect(store.has('large_secure_journey__c0')).toBe(false);
    expect(store.has('large_secure_journey__c1')).toBe(false);
    expect(store.has('large_secure_journey__c2')).toBe(false);
  });

  it('wraps client errors into JourneyRecoveryError with STORAGE_UNAVAILABLE', async () => {
    const failingClient: SecureStoreLike = {
      getItemAsync: vi.fn().mockRejectedValue(new Error('Hardware Keystore locked')),
      setItemAsync: vi.fn().mockRejectedValue(new Error('Keystore out of space')),
      deleteItemAsync: vi.fn().mockRejectedValue(new Error('Keystore access denied')),
    };

    const adapter = new SecureStoreAdapter(failingClient);

    await expect(adapter.getItem('key')).rejects.toThrow(JourneyRecoveryError);
    await expect(adapter.setItem('key', 'val')).rejects.toThrow(JourneyRecoveryError);
    await expect(adapter.removeItem('key')).rejects.toThrow(JourneyRecoveryError);
  });
});

