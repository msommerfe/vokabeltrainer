import { describe, expect, it } from 'vitest';
import { applyRating, indexProgress } from './progress';
import { drawNext, openEntries } from './session';
import type { Direction, VocabEntry } from './types';
import { createMemoryStore } from '../storage/memory';

const LIST = 'liste-1';
const DIRECTION: Direction = 'a-to-b';

function entry(index: number): VocabEntry {
  return { key: `wort${index}|word${index}`, wordA: `Wort${index}`, wordB: `word${index}`, examples: [] };
}

describe('abgebrochene Sitzung', () => {
  it('behält den Fortschritt der bis dahin bewerteten Wörter', async () => {
    const entries = Array.from({ length: 100 }, (_, index) => entry(index));
    const store = createMemoryStore();

    const open = openEntries(entries, indexProgress([]), LIST, DIRECTION, 3);
    expect(open).toHaveLength(100);

    // Nur 7 Wörter bewerten, dann die Sitzung verlassen.
    const rated = open.slice(0, 7);
    for (const item of rated) {
      const next = applyRating(undefined, 'known', {
        listId: LIST,
        entryKey: item.key,
        direction: DIRECTION,
        now: Date.now(),
      });
      await store.saveProgress(next);
    }

    const stored = indexProgress(await store.listProgress(LIST));

    expect(await store.listProgress(LIST)).toHaveLength(7);
    for (const item of rated) {
      expect(stored.get(`${LIST}::${DIRECTION}::${item.key}`)?.streak).toBe(1);
    }
  });

  it('setzt eine unterbrochene Serie in der nächsten Sitzung fort', async () => {
    const item = entry(0);
    const store = createMemoryStore();

    await store.saveProgress(
      applyRating(undefined, 'known', {
        listId: LIST,
        entryKey: item.key,
        direction: DIRECTION,
        now: 1,
      }),
    );

    // Neue Sitzung: Stand aus dem Speicher laden und weiterzählen.
    const loaded = indexProgress(await store.listProgress(LIST));
    const previous = loaded.get(`${LIST}::${DIRECTION}::${item.key}`);
    const next = applyRating(previous, 'known', {
      listId: LIST,
      entryKey: item.key,
      direction: DIRECTION,
      now: 2,
    });

    expect(previous?.streak).toBe(1);
    expect(next.streak).toBe(2);
  });

  it('lässt nicht bewertete Wörter bei 0', async () => {
    const entries = Array.from({ length: 30 }, (_, index) => entry(index));
    const store = createMemoryStore();

    const open = openEntries(entries, indexProgress([]), LIST, DIRECTION, 3);
    const first = drawNext(open);
    if (first === undefined) {
      throw new Error('keine offene Karte');
    }
    await store.saveProgress(
      applyRating(undefined, 'known', {
        listId: LIST,
        entryKey: first.key,
        direction: DIRECTION,
        now: 1,
      }),
    );

    const stored = indexProgress(await store.listProgress(LIST));

    expect(await store.listProgress(LIST)).toHaveLength(1);
    for (const item of open.filter((candidate) => candidate.key !== first.key)) {
      expect(stored.get(`${LIST}::${DIRECTION}::${item.key}`)).toBeUndefined();
    }
  });
});
