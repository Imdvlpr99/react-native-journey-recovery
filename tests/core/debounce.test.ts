import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../../src/utils/debounce';

describe('debounce utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays invocation until after wait ms', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced('a');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('only invokes the last call when called rapidly', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('first');
    debounced('second');
    debounced('third');

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('third');
  });

  it('flush() invokes immediately when pending and returns result', () => {
    const fn = vi.fn().mockReturnValue('result');
    const debounced = debounce(fn, 500);

    debounced('arg');
    const ret = debounced.flush();

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('arg');
    expect(ret).toBe('result');
  });

  it('flush() returns undefined when nothing is pending', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    const ret = debounced.flush();

    expect(fn).not.toHaveBeenCalled();
    expect(ret).toBeUndefined();
  });

  it('flush() clears the pending timer so the fn is not called twice', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced('x');
    debounced.flush();

    vi.advanceTimersByTime(200);

    expect(fn).toHaveBeenCalledOnce();
  });

  it('cancel() aborts the pending invocation', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced('call');
    debounced.cancel();

    vi.advanceTimersByTime(300);

    expect(fn).not.toHaveBeenCalled();
  });

  it('cancel() after flush() is a no-op', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('x');
    debounced.flush();
    debounced.cancel(); // should not throw

    expect(fn).toHaveBeenCalledOnce();
  });

  it('allows re-use after cancel', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a');
    debounced.cancel();
    debounced('b');

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('b');
  });

  it('passes multiple arguments correctly', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);

    debounced('x', 42, { flag: true });
    vi.advanceTimersByTime(50);

    expect(fn).toHaveBeenCalledWith('x', 42, { flag: true });
  });
});
