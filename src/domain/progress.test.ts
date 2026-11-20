import { describe, expect, it } from 'vitest';
import { createMemoryStore } from '../storage/memory';
import {
  applyRating,
  indexProgress,
  isLearned,
  pruneProgressToEntries,
  streakOf,
  summarizeProgress,
} from './progress';
import { drawNext, openEntries } from './session';
import type { Direction, ProgressRecord, VocabEntry } from './types';

const LIST = 'liste-1';

function entry(wordA: string, wordB: string): VocabEntry {
  return { key: `${wordA.toLowerCase()}|${wordB.toLowerCase()}`, wordA, wordB, examples: [] };
}

function record(
  entryKey: string,
  direction: Direction,
  streak: number,
  learned: boolean,
): ProgressRecord {
  return { listId: LIST, entryKey, direction, streak, learned, updatedAt: 0 };
}

const context = { listId: LIST, entryKey: 'haus|house', direction: 'a-to-b' as Direction, now: 1 };

describe('applyRating', () => {
  it('erhöht eine Serie von 1 auf 2', () => {
    const result = applyRating(record('haus|house', 'a-to-b', 1, false), 'known', context);

    expect(result.streak).toBe(2);
    expect(result.learned).toBe(false);
  });

  it('setzt eine Serie von 2 auf 0 zurück', () => {
    const result = applyRating(record('haus|house', 'a-to-b', 2, false), 'unknown', context);

    expect(result.streak).toBe(0);
    expect(result.learned).toBe(false);
  });

  it('startet ohne vorherigen Stand bei 1', () => {
    expect(applyRating(undefined, 'known', context).streak).toBe(1);
  });

  it('markiert das Wort bei der dritten korrekten Antwort in Folge als gelernt', () => {
    const result = applyRating(record('haus|house', 'a-to-b', 2, false), 'known', context);

    expect(result.streak).toBe(3);
    expect(result.learned).toBe(true);
  });

  it('gilt erst ab der dritten Antwort als gelernt', () => {
    const first = applyRating(undefined, 'known', context);
    const second = applyRating(first, 'known', context);

    expect(first.learned).toBe(false);
    expect(second.learned).toBe(false);
    expect(applyRating(second, 'known', context).learned).toBe(true);
  });
});

describe('Trennung je Richtung', () => {
  it('lässt ein in A→B gelerntes Wort in B→A offen', () => {
    const index = indexProgress([record('haus|house', 'a-to-b', 3, true)]);

    expect(isLearned(index, LIST, 'haus|house', 'a-to-b', 3)).toBe(true);
    expect(isLearned(index, LIST, 'haus|house', 'b-to-a', 3)).toBe(false);
    expect(streakOf(index, LIST, 'haus|house', 'b-to-a')).toBe(0);
  });

  it('überschreibt die andere Richtung beim Bewerten nicht', () => {
    const existing = record('haus|house', 'a-to-b', 2, false);
    const index = indexProgress([existing]);

    const updated = applyRating(undefined, 'known', { ...context, direction: 'b-to-a' });

    expect(updated.direction).toBe('b-to-a');
    expect(streakOf(index, LIST, 'haus|house', 'a-to-b')).toBe(2);
  });
});

describe('openEntries', () => {
  const entries = [entry('Haus', 'house'), entry('Hund', 'dog'), entry('Katze', 'cat')];

  it('lässt gelernte Wörter weg', () => {
    const index = indexProgress([record(entries[0]!.key, 'a-to-b', 3, true)]);

    const open = openEntries(entries, index, LIST, 'a-to-b', 3);

    expect(open.map((item) => item.key)).not.toContain(entries[0]!.key);
    expect(open).toHaveLength(2);
  });

  it('nimmt gelernte Wörter nur in der betroffenen Richtung heraus', () => {
    const index = indexProgress([record(entries[0]!.key, 'a-to-b', 3, true)]);

    expect(openEntries(entries, index, LIST, 'a-to-b', 3)).toHaveLength(2);
    expect(openEntries(entries, index, LIST, 'b-to-a', 3)).toHaveLength(3);
  });

  it('ist leer, wenn alle Wörter gelernt sind', () => {
    const index = indexProgress(entries.map((item) => record(item.key, 'a-to-b', 3, true)));

    expect(openEntries(entries, index, LIST, 'a-to-b', 3)).toEqual([]);
  });
});

describe('drawNext', () => {
  const hundred = Array.from({ length: 100 }, (_, index) => entry(`Wort${index}`, `word${index}`));

  it('kann bei 100 offenen Wörtern jedes Wort ziehen, ohne Obergrenze', () => {
    const seen = new Set<string>();
    for (let slot = 0; slot < hundred.length; slot += 1) {
      const drawn = drawNext(hundred, undefined, () => (slot + 0.5) / hundred.length);
      if (drawn !== undefined) {
        seen.add(drawn.key);
      }
    }

    expect(seen.size).toBe(hundred.length);
  });

  it('erlaubt eine Wiederholung, bevor alle Wörter einmal dran waren', () => {
    const first = drawNext(hundred, undefined, () => 0);
    const second = drawNext(hundred, first?.key, () => 0);
    const third = drawNext(hundred, second?.key, () => 0);

    expect(first?.key).toBe(hundred[0]!.key);
    expect(second?.key).toBe(hundred[1]!.key);
    expect(third?.key).toBe(first?.key);
  });

  it('zieht dasselbe Wort nicht direkt hintereinander, solange andere offen sind', () => {
    const three = hundred.slice(0, 3);
    for (const value of [0, 0.2, 0.4, 0.6, 0.8, 0.999]) {
      expect(drawNext(three, three[1]!.key, () => value)?.key).not.toBe(three[1]!.key);
    }
  });

  it('zieht das letzte offene Wort auch direkt hintereinander', () => {
    const single = hundred.slice(0, 1);

    expect(drawNext(single, single[0]!.key, () => 0.5)).toBe(single[0]);
  });

  it('liefert nichts, wenn kein Wort offen ist', () => {
    expect(drawNext([], undefined, () => 0)).toBeUndefined();
  });

  it('zieht ein Wort nach dem dritten Treffer in Folge nicht mehr', () => {
    const three = hundred.slice(0, 3);
    const target = three[0]!;
    let current: ProgressRecord | undefined;
    for (let hit = 0; hit < 3; hit += 1) {
      current = applyRating(current, 'known', { ...context, entryKey: target.key });
    }
    const open = openEntries(three, indexProgress(current ? [current] : []), LIST, 'a-to-b', 3);

    for (const value of [0, 0.3, 0.6, 0.999]) {
      expect(drawNext(open, undefined, () => value)?.key).not.toBe(target.key);
    }
  });
});

describe('summarizeProgress', () => {
  it('weist bei 100 Wörtern mit 40 gelernten 40 gelernte und 60 offene aus', () => {
    const entries = Array.from({ length: 100 }, (_, index) => entry(`Wort${index}`, `word${index}`));
    const learned = entries.slice(0, 40).map((item) => record(item.key, 'a-to-b', 3, true));

    const summary = summarizeProgress(entries, indexProgress(learned), LIST, 'a-to-b', 3);

    expect(summary).toEqual({ learned: 40, open: 60, total: 100 });
  });

  it('zählt für die Gegenrichtung alles als offen', () => {
    const entries = [entry('Haus', 'house')];
    const index = indexProgress([record(entries[0]!.key, 'a-to-b', 3, true)]);

    expect(summarizeProgress(entries, index, LIST, 'b-to-a', 3)).toEqual({
      learned: 0,
      open: 1,
      total: 1,
    });
  });
});

describe('Fortschritt zurücksetzen', () => {
  it('lässt nach dem Zurücksetzen alle Zähler auf 0 und kein Wort als gelernt gelten', async () => {
    const entries = [entry('Haus', 'house'), entry('Hund', 'dog')];
    const store = createMemoryStore();
    await store.putProgressBatch(entries.map((item) => record(item.key, 'a-to-b', 3, true)));

    await store.clearProgress(LIST);
    const index = indexProgress(await store.listProgress(LIST));

    for (const item of entries) {
      expect(streakOf(index, LIST, item.key, 'a-to-b')).toBe(0);
      expect(isLearned(index, LIST, item.key, 'a-to-b', 3)).toBe(false);
    }
    expect(summarizeProgress(entries, index, LIST, 'a-to-b', 3)).toEqual({
      learned: 0,
      open: 2,
      total: 2,
    });
  });

  it('lässt den Fortschritt anderer Listen unangetastet', async () => {
    const item = entry('Haus', 'house');
    const store = createMemoryStore();
    await store.saveProgress(record(item.key, 'a-to-b', 3, true));
    await store.saveProgress({ ...record(item.key, 'a-to-b', 3, true), listId: 'liste-2' });

    await store.clearProgress(LIST);

    expect(await store.listProgress(LIST)).toEqual([]);
    expect(await store.listProgress('liste-2')).toHaveLength(1);
  });
});

describe('pruneProgressToEntries', () => {
  it('behält bestehenden Fortschritt und lässt neue Wörter bei 0 starten', () => {
    const existing = Array.from({ length: 5 }, (_, index) => entry(`Wort${index}`, `word${index}`));
    const added = Array.from({ length: 10 }, (_, index) => entry(`Neu${index}`, `new${index}`));
    const records = existing.map((item) => record(item.key, 'a-to-b', 2, false));

    const kept = pruneProgressToEntries(records, [...existing, ...added]);
    const index = indexProgress(kept);

    expect(kept).toHaveLength(5);
    for (const item of existing) {
      expect(streakOf(index, LIST, item.key, 'a-to-b')).toBe(2);
    }
    for (const item of added) {
      expect(streakOf(index, LIST, item.key, 'a-to-b')).toBe(0);
    }
  });

  it('verwirft Fortschritt zu entfernten Wörtern', () => {
    const remaining = entry('Haus', 'house');
    const removed = entry('Hund', 'dog');
    const records = [
      record(remaining.key, 'a-to-b', 1, false),
      record(removed.key, 'a-to-b', 3, true),
    ];

    const kept = pruneProgressToEntries(records, [remaining]);

    expect(kept.map((item) => item.entryKey)).toEqual([remaining.key]);
  });
});
