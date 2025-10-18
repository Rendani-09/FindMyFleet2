import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges and dedupes class names', () => {
    const result = cn('btn', 'btn-primary', { 'hidden': false }, 'ml-2');
    expect(result).toContain('btn');
    expect(result).toContain('btn-primary');
    expect(result).toContain('ml-2');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });
});
