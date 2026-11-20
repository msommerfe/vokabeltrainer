import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings } from './settings';

describe('parseSettings', () => {
  it('liefert ohne gespeicherte Werte die Standardwerte', () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toEqual({
      vocab: { sessionSize: null, threshold: 3 },
      exercises: { sessionSize: null, threshold: 1 },
    });
  });

  it('übernimmt gültige Werte', () => {
    const settings = {
      vocab: { sessionSize: 20, threshold: 5 },
      exercises: { sessionSize: null, threshold: 2 },
    };

    expect(parseSettings(settings)).toEqual(settings);
  });

  it.each([
    ['Schwelle 0', { vocab: { sessionSize: null, threshold: 0 } }],
    ['Schwelle 11', { vocab: { sessionSize: null, threshold: 11 } }],
    ['Schwelle 2.5', { vocab: { sessionSize: null, threshold: 2.5 } }],
    ['Sitzungsgröße 0', { vocab: { sessionSize: 0, threshold: 3 } }],
    ['Sitzungsgröße als Text', { vocab: { sessionSize: 'zehn', threshold: 3 } }],
    ['beschädigter Bereich', { vocab: 'kaputt' }],
  ])('fällt bei %s auf die Standardwerte des Bereichs zurück', (_label, raw) => {
    expect(parseSettings(raw).vocab).toEqual(DEFAULT_SETTINGS.vocab);
  });

  it('behält gültige Felder, wenn nur eines ungültig ist', () => {
    expect(parseSettings({ vocab: { sessionSize: 10, threshold: 99 } }).vocab).toEqual({
      sessionSize: 10,
      threshold: 3,
    });
  });
});
