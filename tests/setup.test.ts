import { describe, it, expect } from 'vitest';
import { VERSION } from '../src/index';
import pkg from '../package.json';

describe('Project Environment', () => {
  it('runs tests with Vitest successfully', () => {
    expect(VERSION).toBe(pkg.version);
  });
});
