import { describe, expect, it, vi } from 'vitest';
import { deriveChoiceKey } from '../domain/entryKey';
import type { ProgressRecord, VocabList } from '../domain/types';
import { createMemoryStore } from '../storage/memory';
import type { VocabStore } from '../storage/types';
import { SAMPLE_FILES, SAMPLES_VERSION, syncSamples, type SampleFile } from './samples';

const [grund, alltag, aufbau] = SAMPLE_FILES as [SampleFile, SampleFile, SampleFile];

/** Simuliert die mitgelieferte Datei; `withExercises` entspricht dem neuen Stand. */
function sampleList(sample: SampleFile, withExercises: boolean): VocabList {
  return {
    id: crypto.randomUUID(),
    name: sample.name,
    languageA: 'Spanisch',
    languageB: 'Deutsch',
    entries: [{ key: 'hablar|sprechen', wordA: 'hablar', wordB: 'sprechen', examples: [] }],
    exercises: withExercises
      ? [
          {
            kind: 'choice',
            key: deriveChoiceKey('F?', 'ja'),
            question: 'F?',
            options: ['ja', 'nein'],
            answerIndex: 0,
          },
        ]
      : [],
    importedAt: Date.now(),
  };
}

function deps(storedVersion: number | undefined) {
  let version = storedVersion;
  return {
    readVersion: () => version,
    writeVersion: vi.fn((next: number) => {
      version = next;
    }),
    loadSample: vi.fn(
      (sample: SampleFile): Promise<VocabList | undefined> =>
        Promise.resolve(sampleList(sample, true)),
    ),
    current: () => version,
  };
}

function learned(listId: string): ProgressRecord {
  return {
    listId,
    entryKey: 'hablar|sprechen',
    direction: 'a-to-b',
    streak: 3,
    learned: true,
    updatedAt: 1,
  };
}

async function namesOf(store: VocabStore): Promise<string[]> {
  return (await store.listLists()).map((list) => list.name).sort();
}

describe('syncSamples', () => {
  it('legt beim Erststart alle drei Listen mit Herkunft an', async () => {
    const store = createMemoryStore();
    const sync = deps(undefined);

    await syncSamples(store, sync);

    const lists = await store.listLists();
    expect(lists.map((list) => list.sampleFile).sort()).toEqual(
      SAMPLE_FILES.map((sample) => sample.file).sort(),
    );
    expect(lists.every((list) => list.exercises.length > 0)).toBe(true);
    expect(sync.current()).toBe(SAMPLES_VERSION);
  });

  it('ändert bei gleicher Version nichts', async () => {
    const store = createMemoryStore();
    await syncSamples(store, deps(undefined));
    const before = await store.listLists();

    const again = deps(SAMPLES_VERSION);
    await syncSamples(store, again);

    expect(again.loadSample).not.toHaveBeenCalled();
    expect(await store.listLists()).toEqual(before);
  });

  it('aktualisiert eine vorhandene Beispielliste und behält ihren Fortschritt', async () => {
    const store = createMemoryStore();
    const old = { ...sampleList(grund, false), sampleFile: grund.file, importedAt: 5 };
    await store.saveList(old);
    await store.saveProgress(learned(old.id));

    await syncSamples(store, deps(SAMPLES_VERSION - 1));

    const [updated] = await store.listLists();
    expect(updated?.exercises).toHaveLength(1);
    expect(updated?.importedAt).toBe(5);
    expect(await store.listProgress(updated?.id ?? '')).toEqual([
      { ...learned(old.id), listId: updated?.id },
    ]);
  });

  it('übernimmt beim Übergang vom alten Flag gleichnamige Listen ohne Herkunft einmalig', async () => {
    const store = createMemoryStore();
    const legacy = sampleList(alltag, false);
    await store.saveList(legacy);
    await store.saveProgress(learned(legacy.id));

    await syncSamples(store, deps(1));

    const lists = await store.listLists();
    expect(lists).toHaveLength(1);
    expect(lists[0]?.sampleFile).toBe(alltag.file);
    expect(lists[0]?.exercises).toHaveLength(1);
    expect(await store.listProgress(lists[0]?.id ?? '')).toHaveLength(1);
  });

  it('legt eine vom Nutzer gelöschte Beispielliste nicht wieder an', async () => {
    const store = createMemoryStore();
    await store.saveList(sampleList(grund, false));
    await store.saveList({ ...sampleList(aufbau, false), name: 'Eigene Liste' });

    await syncSamples(store, deps(1));

    expect(await namesOf(store)).toEqual(['Eigene Liste', grund.name]);
  });

  it('überspringt eine nicht ladbare Beispieldatei', async () => {
    const store = createMemoryStore();
    const sync = deps(undefined);
    sync.loadSample.mockImplementation((sample: SampleFile) =>
      Promise.resolve(sample === alltag ? undefined : sampleList(sample, true)),
    );

    await syncSamples(store, sync);

    expect(await namesOf(store)).toEqual([grund.name, aufbau.name].sort());
  });
});
