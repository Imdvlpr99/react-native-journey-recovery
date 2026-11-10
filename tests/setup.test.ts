import { describe, it, expect } from 'vitest';
import { VERSION } from '../src/index';

describe('Project Environment', () => {
  it('runs tests with Vitest successfully', () => {
    expect(VERSION).toBe('0.1.0');
  });
});

