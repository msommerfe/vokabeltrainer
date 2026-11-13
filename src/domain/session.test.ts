import { describe, expect, it } from 'vitest';
import { applyRating, indexProgress } from './progress';
import { buildRound, MAX_ROUND_SIZE } from './session';
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

    const round = buildRound(entries, indexProgress([]), LIST, DIRECTION);
    expect(round).toHaveLength(MAX_ROUND_SIZE);

    // Nur die ersten 7 Karten bewerten, dann die Sitzung verlassen.
    const rated = round.slice(0, 7);
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

  it('setzt eine unterbrochene Serie im nächsten Durchgang fort', async () => {
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

    // Neuer Durchgang: Stand aus dem Speicher laden und weiterzählen.
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

  it('lässt nicht bewertete Wörter des Durchgangs bei 0', async () => {
    const entries = Array.from({ length: 30 }, (_, index) => entry(index));
    const store = createMemoryStore();

    const round = buildRound(entries, indexProgress([]), LIST, DIRECTION);
    const first = round[0];
    if (first === undefined) {
      throw new Error('leerer Durchgang');
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
    for (const item of round.slice(1)) {
      expect(stored.get(`${LIST}::${DIRECTION}::${item.key}`)).toBeUndefined();
    }
  });
});
