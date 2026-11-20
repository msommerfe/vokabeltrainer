import { describe, expect, it, vi } from 'vitest';
import { deriveChoiceKey } from '../domain/entryKey';
import { indexExerciseProgress, isSolved } from '../domain/exercises';
import type {
  Exercise,
  ExerciseProgressRecord,
  ProgressRecord,
  VocabList,
} from '../domain/types';
import { createMemoryStore } from './memory';
import { normalizeStoredList, removeListCompletely, replaceList } from './operations';
import { createResilientStore } from './resilient';
import type { VocabStore } from './types';

function choice(question: string, explanation?: string): Exercise {
  const exercise: Exercise = {
    kind: 'choice',
    key: deriveChoiceKey(question, 'ja'),
    question,
    options: ['ja', 'nein'],
    answerIndex: 0,
  };
  return explanation === undefined ? exercise : { ...exercise, explanation };
}

function makeList(id: string, exercises: Exercise[]): VocabList {
  return {
    id,
    name: 'Liste',
    languageA: 'Spanisch',
    languageB: 'Deutsch',
    entries: [{ key: 'hablar|sprechen', wordA: 'hablar', wordB: 'sprechen', examples: [] }],
    exercises,
    importedAt: 1,
  };
}

function solved(listId: string, exerciseKey: string): ExerciseProgressRecord {
  return { listId, exerciseKey, streak: 1, updatedAt: 1 };
}

const vocabRecord: ProgressRecord = {
  listId: 'l1',
  entryKey: 'hablar|sprechen',
  direction: 'a-to-b',
  streak: 2,
  learned: false,
  updatedAt: 1,
};

describe('Übungsfortschritt im Speicher', () => {
  it('liefert beim Lesen denselben Datensatz zurück und überschreibt statt zu duplizieren', async () => {
    const store = createMemoryStore();
    const record = { ...solved('l1', 'k'), streak: 0 };

    await store.saveExerciseProgress(record);
    expect(await store.listExerciseProgress('l1')).toEqual([record]);

    await store.saveExerciseProgress(solved('l1', 'k'));
    expect(await store.listExerciseProgress('l1')).toEqual([solved('l1', 'k')]);
  });

  it('meldet einen Hinweis, wenn der Übungsfortschritt nicht gespeichert werden kann', async () => {
    const failing = {
      ...createMemoryStore(),
      saveExerciseProgress: () => Promise.reject(new Error('voll')),
    } satisfies VocabStore;
    const onProblem = vi.fn();
    const store = createResilientStore(failing, onProblem);

    await expect(store.saveExerciseProgress(solved('l1', 'k'))).resolves.toBeUndefined();
    expect(onProblem.mock.calls[0]?.[0]).toContain('nicht dauerhaft gesichert');
  });

  it('ergänzt bei früher gespeicherten Listen eine leere Übungsliste', async () => {
    const legacy = makeList('alt', []) as Partial<VocabList>;
    delete legacy.exercises;
    const store = createMemoryStore();

    await store.saveList(legacy as VocabList);

    expect((await store.listLists())[0]?.exercises).toEqual([]);
    expect(normalizeStoredList(legacy as VocabList).exercises).toEqual([]);
  });

  it('entfernt beim Löschen einer Liste Vokabel- und Übungsfortschritt', async () => {
    const store = createMemoryStore();
    await store.saveList(makeList('l1', [choice('F?')]));
    await store.saveProgress(vocabRecord);
    await store.saveExerciseProgress(solved('l1', choice('F?').key));
    await store.saveExerciseProgress(solved('l2', 'fremd'));

    await removeListCompletely(store, 'l1');

    expect(await store.listProgress('l1')).toEqual([]);
    expect(await store.listExerciseProgress('l1')).toEqual([]);
    expect(await store.listExerciseProgress('l2')).toHaveLength(1);
  });
});

describe('replaceList', () => {
  it('übernimmt gelöste Übungen, lässt neue offen und ignoriert geänderte Erklärungen', async () => {
    const store = createMemoryStore();
    const kept = choice('Bleibt?', 'alte Erklärung');
    const dropped = choice('Fällt weg?');
    await store.saveList(makeList('alt', [kept, dropped]));
    await store.saveProgress({ ...vocabRecord, listId: 'alt' });
    await store.saveExerciseProgress(solved('alt', kept.key));
    await store.saveExerciseProgress(solved('alt', dropped.key));

    const added = Array.from({ length: 5 }, (_, index) => choice(`Neu ${index}?`));
    const next = makeList('neu', [choice('Bleibt?', 'neue Erklärung'), ...added]);
    await replaceList(store, 'alt', next);

    const progress = await store.listExerciseProgress('neu');
    expect(progress).toEqual([solved('neu', kept.key)]);
    expect(await store.listProgress('neu')).toHaveLength(1);
    expect(await store.listExerciseProgress('alt')).toEqual([]);
    expect((await store.listLists()).map((list) => list.id)).toEqual(['neu']);
  });
});

describe('früher gespeicherter Übungsfortschritt', () => {
  it('rechnet "gelöst" in Zähler 1 um, sodass die Übung bei Schwelle 1 gelöst bleibt', async () => {
    const store = createMemoryStore();
    const legacy = { listId: 'l1', exerciseKey: 'alt', solved: true, updatedAt: 1 };
    const legacyOpen = { listId: 'l1', exerciseKey: 'offen', solved: false, updatedAt: 1 };
    await store.putExerciseProgressBatch([
      legacy as unknown as ExerciseProgressRecord,
      legacyOpen as unknown as ExerciseProgressRecord,
    ]);

    const records = await store.listExerciseProgress('l1');
    const index = indexExerciseProgress(records);

    expect(records.map((record) => record.streak)).toEqual([1, 0]);
    expect(isSolved(index, 'l1', 'alt', 1)).toBe(true);
    expect(isSolved(index, 'l1', 'offen', 1)).toBe(false);
  });
});

describe('getrenntes Zurücksetzen', () => {
  it('lässt beim Zurücksetzen der Übungen den Vokabelfortschritt unverändert', async () => {
    const store = createMemoryStore();
    await store.saveProgress(vocabRecord);
    await store.saveExerciseProgress(solved('l1', 'k'));

    await store.clearExerciseProgress('l1');

    expect(await store.listExerciseProgress('l1')).toEqual([]);
    expect(await store.listProgress('l1')).toEqual([vocabRecord]);
  });

  it('lässt beim Zurücksetzen der Vokabeln den Übungsfortschritt unverändert', async () => {
    const store = createMemoryStore();
    await store.saveProgress(vocabRecord);
    await store.saveExerciseProgress(solved('l1', 'k'));

    await store.clearProgress('l1');

    expect(await store.listProgress('l1')).toEqual([]);
    expect(await store.listExerciseProgress('l1')).toEqual([solved('l1', 'k')]);
  });
});
