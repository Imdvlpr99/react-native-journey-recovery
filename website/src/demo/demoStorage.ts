import type { AsyncStorageLike } from 'react-native-journey-recovery';

export type StorageLogEvent =
  | { type: 'write'; key: string; bytes: number }
  | { type: 'remove'; key: string }
  | { type: 'lost'; key: string };

type Listener = (event: StorageLogEvent) => void;

function getLocalStorage(): Storage | null {
  try {
    const ls = window.localStorage;
    const probe = '__jr_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    // Private mode or blocked storage: fall back to memory so the demo still works.
    return null;
  }
}

/**
 * AsyncStorage-compatible client backed by localStorage (which is what AsyncStorage uses on web).
 *
 * The playground adds two things a real app does not have:
 * - `setAlive(false)` simulates a killed process: writes are dropped, as they would be on a device.
 * - `subscribe` / `peek` / `poke` let the inspector watch and tamper with storage.
 */
export function createDemoStorage() {
  const ls = getLocalStorage();
  const memory = new Map<string, string>();
  const listeners = new Set<Listener>();
  let alive = true;

  const read = (key: string): string | null => (ls ? ls.getItem(key) : memory.get(key) ?? null);
  const write = (key: string, value: string) => (ls ? ls.setItem(key, value) : memory.set(key, value));
  const remove = (key: string) => (ls ? ls.removeItem(key) : memory.delete(key));
  const emit = (event: StorageLogEvent) => listeners.forEach((l) => l(event));

  const client: AsyncStorageLike = {
    async getItem(key) {
      return read(key);
    },
    async setItem(key, value) {
      if (!alive) {
        emit({ type: 'lost', key });
        return;
      }
      write(key, value);
      emit({ type: 'write', key, bytes: new TextEncoder().encode(value).length });
    },
    async removeItem(key) {
      if (!alive) {
        emit({ type: 'lost', key });
        return;
      }
      remove(key);
      emit({ type: 'remove', key });
    },
    async getAllKeys() {
      return ls ? Object.keys(ls) : Array.from(memory.keys());
    },
  };

  return {
    client,
    persistent: ls !== null,
    setAlive(value: boolean) {
      alive = value;
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** Read without going through the app. */
    peek: read,
    /** Write directly, bypassing the app (used to simulate corruption). */
    poke(key: string, value: string | null) {
      if (value === null) remove(key);
      else write(key, value);
    },
  };
}

export type DemoStorage = ReturnType<typeof createDemoStorage>;
