import { describe, expect, it } from 'vitest';
import { deriveEntryKey, progressKey } from './entryKey';

describe('deriveEntryKey', () => {
  it('bleibt bei geänderter Groß-/Kleinschreibung stabil', () => {
    expect(deriveEntryKey('Haus', 'house')).toBe(deriveEntryKey('HAUS', 'House'));
  });

  it('bleibt bei zusätzlichem Leerraum stabil', () => {
    expect(deriveEntryKey('  der   Hund ', 'the  dog')).toBe(deriveEntryKey('der Hund', 'the dog'));
  });

  it('ist unabhängig von der Position in der Liste', () => {
    const list = [
      { a: 'Haus', b: 'house' },
      { a: 'Hund', b: 'dog' },
    ];
    const reordered = [...list].reverse();

    const keys = list.map((e) => deriveEntryKey(e.a, e.b)).sort();
    const reorderedKeys = reordered.map((e) => deriveEntryKey(e.a, e.b)).sort();

    expect(reorderedKeys).toEqual(keys);
  });

  it('ändert sich nicht, wenn Beispiele ergänzt werden', () => {
    const before = deriveEntryKey('Haus', 'house');
    const after = deriveEntryKey('Haus', 'house');
    expect(after).toBe(before);
  });

  it('unterscheidet verschiedene Wortpaare', () => {
    expect(deriveEntryKey('Haus', 'house')).not.toBe(deriveEntryKey('Haus', 'home'));
    expect(deriveEntryKey('Haus', 'house')).not.toBe(deriveEntryKey('Hund', 'house'));
  });

  it('verwechselt Wortpaare mit Trennzeichen nicht', () => {
    expect(deriveEntryKey('a|b', 'c')).not.toBe(deriveEntryKey('a', 'b|c'));
  });

  it('unterscheidet die Richtung des Wortpaars', () => {
    expect(deriveEntryKey('Haus', 'house')).not.toBe(deriveEntryKey('house', 'Haus'));
  });
});

describe('progressKey', () => {
  it('unterscheidet beide Abfragerichtungen', () => {
    const entryKey = deriveEntryKey('Haus', 'house');
    expect(progressKey('liste-1', entryKey, 'a-to-b')).not.toBe(
      progressKey('liste-1', entryKey, 'b-to-a'),
    );
  });

  it('unterscheidet verschiedene Listen', () => {
    const entryKey = deriveEntryKey('Haus', 'house');
    expect(progressKey('liste-1', entryKey, 'a-to-b')).not.toBe(
      progressKey('liste-2', entryKey, 'a-to-b'),
    );
  });
});
