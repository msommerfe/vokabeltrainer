import { describe, expect, it } from 'vitest';
import {
  applyRating,
  crossedThreshold,
  indexProgress,
  isLearned,
  summarizeProgress,
} from './progress';
import { openEntries, pickSession } from './session';
import type { Direction, ProgressRecord, VocabEntry } from './types';

const LIST = 'liste-1';
const DIRECTION: Direction = 'a-to-b';

function entry(index: number): VocabEntry {
  return { key: `wort${index}|word${index}`, wordA: `Wort${index}`, wordB: `word${index}`, examples: [] };
}

function withStreak(entryKey: string, streak: number): ProgressRecord {
  return { listId: LIST, entryKey, direction: DIRECTION, streak, learned: false, updatedAt: 0 };
}

describe('einstellbare Gelernt-Schwelle', () => {
  const word = entry(0);

  it('lässt bei Schwelle 5 ein Wort mit Zähler 4 offen', () => {
    const third = withStreak(word.key, 3);
    const fourth = applyRating(third, 'known', {
      listId: LIST,
      entryKey: word.key,
      direction: DIRECTION,
      now: 1,
    }, 5);

    expect(fourth.streak).toBe(4);
    expect(isLearned(indexProgress([fourth]), LIST, word.key, DIRECTION, 5)).toBe(false);
  });

  it('macht ein Wort mit Zähler 2 beim Senken der Schwelle auf 2 sofort gelernt', () => {
    const index = indexProgress([withStreak(word.key, 2)]);

    expect(isLearned(index, LIST, word.key, DIRECTION, 3)).toBe(false);
    expect(isLearned(index, LIST, word.key, DIRECTION, 2)).toBe(true);
  });

  it('macht ein gelerntes Wort beim Erhöhen der Schwelle wieder offen', () => {
    const index = indexProgress([{ ...withStreak(word.key, 3), learned: true }]);

    expect(isLearned(index, LIST, word.key, DIRECTION, 3)).toBe(true);
    expect(isLearned(index, LIST, word.key, DIRECTION, 4)).toBe(false);
    expect(openEntries([word], index, LIST, DIRECTION, 4)).toEqual([word]);
    expect(summarizeProgress([word], index, LIST, DIRECTION, 4).learned).toBe(0);
  });

  it('meldet "neu gelernt" genau beim Erreichen der eingestellten Schwelle', () => {
    expect(crossedThreshold(1, 2, 2)).toBe(true);
    expect(crossedThreshold(0, 1, 2)).toBe(false);
    expect(crossedThreshold(2, 3, 2)).toBe(false);
    expect(crossedThreshold(4, 5, 5)).toBe(true);
    expect(crossedThreshold(2, 0, 3)).toBe(false);
  });
});

describe('pickSession', () => {
  const hundred = Array.from({ length: 100 }, (_, index) => entry(index));

  it('wählt bei Größe 20 aus 100 offenen genau 20 verschiedene', () => {
    const picked = pickSession(hundred, 20);

    expect(picked).toHaveLength(20);
    expect(new Set(picked.map((item) => item.key)).size).toBe(20);
    expect(picked.every((item) => hundred.includes(item))).toBe(true);
  });

  it('nimmt alle, wenn weniger offen sind als die Größe', () => {
    expect(pickSession(hundred.slice(0, 12), 20)).toHaveLength(12);
  });

  it('nimmt bei "alle" sämtliche Elemente', () => {
    expect(pickSession(hundred, null)).toEqual(hundred);
  });

  it('wechselt die Auswahl zwischen Aufrufen', () => {
    const first = pickSession(hundred, 20).map((item) => item.key);
    const second = pickSession(hundred, 20).map((item) => item.key);

    expect(first).not.toEqual(second);
  });
});
