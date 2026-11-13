import { describe, expect, it } from 'vitest';

describe('Testumgebung', () => {
  it('führt Tests aus', () => {
    expect(true).toBe(true);
  });

  it('stellt eine DOM-Umgebung bereit', () => {
    expect(typeof document).toBe('object');
  });
});
