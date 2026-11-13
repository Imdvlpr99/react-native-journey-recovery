import { describe, it, expect, vi } from 'vitest';
import { SecureStoreAdapter, SecureStoreLike, encodeSecureStoreKey } from '../../src/storage/SecureStoreAdapter';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { JourneyRecoveryError } from '../../src/utils/errors';

/**
 * Mock that enforces expo-secure-store's real constraints:
 * keys must match [A-Za-z0-9._-] and values over 2048 UTF-8 bytes are rejected.
 */
const createStrictClient = () => {
  const store = new Map<string, string>();
  const assertKey = (key: string) => {
    if (!/^[\w.-]+$/.test(key)) throw new Error(`Invalid key provided to SecureStore: ${key}`);
  };
  const client: SecureStoreLike = {
    getItemAsync: vi.fn(async (key: string) => {
      assertKey(key);
      return store.get(key) ?? null;
    }),
    setItemAsync: vi.fn(async (key: string, value: string) => {
      assertKey(key);
      if (new TextEncoder().encode(value).length > 2048) throw new Error('Value exceeds 2048 bytes');
      store.set(key, value);
    }),
    deleteItemAsync: vi.fn(async (key: string) => {
      assertKey(key);
      store.delete(key);
    }),
  };
  return { client, store };
};

const chunkKeys = (store: Map<string, string>, base: string) =>
  [...store.keys()].filter((k) => k.startsWith(`${base}__`));

describe('SecureStoreAdapter', () => {
  it('encodes keys into the SecureStore alphabet without collisions', () => {
    const keys = ['@rn_journey:u:user_42:checkout', 'a_0040', 'a@', 'plain.key-1'];
    const encoded = keys.map(encodeSecureStoreKey);
    encoded.forEach((k) => expect(k).toMatch(/^[\w.-]+$/));
    expect(new Set(encoded).size).toBe(keys.length);
    expect(encodeSecureStoreKey('plain.key-1')).toBe('plain.key-1');
  });

  it('works with the library default keys against a strict SecureStore', async () => {
    const { client } = createStrictClient();
    const cm = new CheckpointManager(new SecureStoreAdapter(client), { userId: 'user:42' });
    await cm.save('checkout', { step: 2 }, { version: 1 });
    expect((await cm.get<{ step: number }>('checkout'))?.data.step).toBe(2);
  });

  it('saves, retrieves, and removes non-chunked values', async () => {
    const { client, store } = createStrictClient();
    const adapter = new SecureStoreAdapter(client, { trackKeys: false });

    await adapter.setItem('user_token', 'secret_value_123');
    expect(store.get(encodeSecureStoreKey('user_token'))).toBe('secret_value_123');
    expect(await adapter.getItem('user_token')).toBe('secret_value_123');

    await adapter.removeItem('user_token');
    expect(store.size).toBe(0);
    expect(await adapter.getItem('user_token')).toBeNull();
  });

  it('chunks large values, reassembles them, and removes every chunk', async () => {
    const { client, store } = createStrictClient();
    const adapter = new SecureStoreAdapter(client, { chunkSize: 50, trackKeys: false });
    const base = encodeSecureStoreKey('journey');

    const payload = 'A'.repeat(125); // 50 + 50 + 25
    await adapter.setItem('journey', payload);

    const manifest = JSON.parse(store.get(base)!);
    expect(manifest).toMatchObject({ __isSecureChunked: true, totalChunks: 3 });
    expect(chunkKeys(store, base)).toHaveLength(3);
    expect(await adapter.getItem('journey')).toBe(payload);

    await adapter.removeItem('journey');
    expect(store.size).toBe(0);
  });

  it('keeps chunks within the byte limit for multi-byte text and never splits characters', async () => {
    const { client } = createStrictClient();
    const adapter = new SecureStoreAdapter(client, { trackKeys: false }); // default 1800 bytes
    const payload = 'Привет 😀 '.repeat(400); // ~6 KB of 2-byte and 4-byte characters
    await adapter.setItem('i18n', payload);
    expect(await adapter.getItem('i18n')).toBe(payload);
  });

  it('removes the previous chunks when a value shrinks (no secrets left behind)', async () => {
    const { client, store } = createStrictClient();
    const adapter = new SecureStoreAdapter(client, { chunkSize: 10, trackKeys: false });
    const base = encodeSecureStoreKey('k');

    await adapter.setItem('k', 'SECRET-DATA-THAT-SPANS-CHUNKS');
    await adapter.setItem('k', 'small');

    expect(chunkKeys(store, base)).toHaveLength(0);
    expect([...store.values()].some((v) => v.includes('SECRET'))).toBe(false);
    expect(await adapter.getItem('k')).toBe('small');
  });

  it('replaces chunk sets on rewrite without leaving the old generation behind', async () => {
    const { client, store } = createStrictClient();
    const adapter = new SecureStoreAdapter(client, { chunkSize: 10, trackKeys: false });
    await adapter.setItem('k', 'first-value-long-enough');
    await adapter.setItem('k', 'second-value-long-enough!');
    expect(chunkKeys(store, encodeSecureStoreKey('k'))).toHaveLength(3);
    expect(await adapter.getItem('k')).toBe('second-value-long-enough!');
  });

  it('keeps the last good value when a chunked write is interrupted', async () => {
    const { client, store } = createStrictClient();
    const adapter = new SecureStoreAdapter(client, { chunkSize: 10, trackKeys: false });
    await adapter.setItem('k', 'GOOD-VALUE-SPANNING-CHUNKS');

    // Fail on the second chunk of the next write, before the manifest is switched.
    let calls = 0;
    const original = client.setItemAsync;
    client.setItemAsync = vi.fn(async (key: string, value: string) => {
      calls += 1;
      if (calls === 2) throw new Error('app killed mid-write');
      return original(key, value);
    });

    await expect(adapter.setItem('k', 'NEW-VALUE-SPANNING-CHUNKS!!')).rejects.toThrow(JourneyRecoveryError);
    expect(await adapter.getItem('k')).toBe('GOOD-VALUE-SPANNING-CHUNKS');
    expect(store.size).toBeGreaterThan(0);
  });

  it('still reads the legacy chunk layout', async () => {
    const { client, store } = createStrictClient();
    const adapter = new SecureStoreAdapter(client, { trackKeys: false });
    const base = encodeSecureStoreKey('old');
    store.set(base, JSON.stringify({ __isSecureChunked: true, totalChunks: 2 }));
    store.set(`${base}__c0`, 'hello ');
    store.set(`${base}__c1`, 'world');
    expect(await adapter.getItem('old')).toBe('hello world');
  });

  it('reports a missing chunk as corruption', async () => {
    const { client, store } = createStrictClient();
    const adapter = new SecureStoreAdapter(client, { chunkSize: 10, trackKeys: false });
    await adapter.setItem('k', 'VALUE-SPANNING-CHUNKS');
    store.delete(chunkKeys(store, encodeSecureStoreKey('k'))[0]);
    await expect(adapter.getItem('k')).rejects.toMatchObject({ code: 'SNAPSHOT_CORRUPTED' });
  });

  it('tracks keys so getAllKeys, clearUserJourneys and deleteAll work', async () => {
    const { client, store } = createStrictClient();
    const adapter = new SecureStoreAdapter(client);
    const alice = new CheckpointManager(adapter, { userId: 'alice' });
    const bob = new CheckpointManager(adapter, { userId: 'bob' });

    await alice.save('checkout', { a: 1 }, { version: 1 });
    await bob.save('checkout', { b: 1 }, { version: 1 });
    expect((await adapter.getAllKeys()).sort()).toEqual(['@rn_journey:u:alice:checkout', '@rn_journey:u:bob:checkout']);

    await alice.clearUserJourneys('alice');
    expect(await alice.get('checkout')).toBeNull();
    expect(await bob.get('checkout')).not.toBeNull();

    await bob.deleteAll();
    expect(await adapter.getAllKeys()).toEqual([]);
    // Only the (now empty) index remains.
    expect([...store.keys()].every((k) => k.startsWith('__jr_index__'))).toBe(true);
  });

  it('returns no keys when tracking is disabled', async () => {
    const { client } = createStrictClient();
    const adapter = new SecureStoreAdapter(client, { trackKeys: false });
    await adapter.setItem('k', 'v');
    expect(await adapter.getAllKeys()).toEqual([]);
  });

  it('wraps client errors into JourneyRecoveryError with STORAGE_UNAVAILABLE', async () => {
    const failingClient: SecureStoreLike = {
      getItemAsync: vi.fn().mockRejectedValue(new Error('Hardware Keystore locked')),
      setItemAsync: vi.fn().mockRejectedValue(new Error('Keystore out of space')),
      deleteItemAsync: vi.fn().mockRejectedValue(new Error('Keystore access denied')),
    };

    const adapter = new SecureStoreAdapter(failingClient);

    await expect(adapter.getItem('key')).rejects.toMatchObject({ code: 'STORAGE_UNAVAILABLE' });
    await expect(adapter.setItem('key', 'val')).rejects.toMatchObject({ code: 'STORAGE_UNAVAILABLE' });
    await expect(adapter.removeItem('key')).rejects.toMatchObject({ code: 'STORAGE_UNAVAILABLE' });
  });
});
