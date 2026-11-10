export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  flush: () => void;
  cancel: () => void;
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds.
 * Provides .flush() to invoke immediately if pending, and .cancel() to abort pending calls.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  waitMs: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;

  function debounced(this: unknown, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      flush();
    }, waitMs);
  }

  function flush() {
    if (timeoutId !== null && lastArgs !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      const args = lastArgs;
      const context = lastThis;
      lastArgs = null;
      lastThis = null;
      fn.apply(context, args);
    }
  }

  function cancel() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
  }

  debounced.flush = flush;
  debounced.cancel = cancel;

  return debounced;
}
