import { describe, expect, it, vi } from 'vitest';
import type { ProgressRecord, VocabList } from '../domain/types';
import { createMemoryStore } from './memory';
import { removeListCompletely } from './operations';
import { createResilientStore } from './resilient';
import type { VocabStore } from './types';

function makeList(id: string): VocabList {
  return {
    id,
    name: `Liste ${id}`,
    languageA: 'Deutsch',
    languageB: 'Englisch',
    entries: [{ key: 'haus|house', wordA: 'Haus', wordB: 'house', examples: [] }],
    importedAt: 1,
  };
}

function makeProgress(listId: string, entryKey: string): ProgressRecord {
  return {
    listId,
    entryKey,
    direction: 'a-to-b',
    streak: 1,
    learned: false,
    updatedAt: 1,
  };
}

describe('Speicher', () => {
  it('liefert beim Lesen denselben Datensatz zurück, der geschrieben wurde', async () => {
    const store = createMemoryStore();
    const list = makeList('l1');

    await store.saveList(list);

    expect(await store.listLists()).toEqual([list]);
  });

  it('schreibt und liest Fortschritt je Liste', async () => {
    const store = createMemoryStore();
    await store.saveProgress(makeProgress('l1', 'haus|house'));
    await store.saveProgress(makeProgress('l2', 'hund|dog'));

    const forList = await store.listProgress('l1');

    expect(forList).toHaveLength(1);
    expect(forList[0]?.entryKey).toBe('haus|house');
  });

  it('überschreibt denselben Fortschrittsschlüssel statt zu duplizieren', async () => {
    const store = createMemoryStore();
    await store.saveProgress(makeProgress('l1', 'haus|house'));
    await store.saveProgress({ ...makeProgress('l1', 'haus|house'), streak: 3, learned: true });

    const records = await store.listProgress('l1');

    expect(records).toHaveLength(1);
    expect(records[0]?.streak).toBe(3);
  });

  it('hält beide Richtungen desselben Wortes getrennt', async () => {
    const store = createMemoryStore();
    await store.saveProgress(makeProgress('l1', 'haus|house'));
    await store.saveProgress({ ...makeProgress('l1', 'haus|house'), direction: 'b-to-a' });

    expect(await store.listProgress('l1')).toHaveLength(2);
  });

  it('entfernt beim Löschen einer Liste auch deren Fortschritt', async () => {
    const store = createMemoryStore();
    await store.saveList(makeList('l1'));
    await store.saveList(makeList('l2'));
    await store.saveProgress(makeProgress('l1', 'haus|house'));
    await store.saveProgress(makeProgress('l2', 'hund|dog'));

    await removeListCompletely(store, 'l1');

    expect((await store.listLists()).map((list) => list.id)).toEqual(['l2']);
    expect(await store.listProgress('l1')).toEqual([]);
    expect(await store.listProgress('l2')).toHaveLength(1);
  });
});

describe('createResilientStore', () => {
  const failing: VocabStore = {
    listLists: () => Promise.reject(new Error('kaputt')),
    listProgress: () => Promise.reject(new Error('kaputt')),
    saveList: () => Promise.reject(new Error('kaputt')),
    deleteList: () => Promise.reject(new Error('kaputt')),
    saveProgress: () => Promise.reject(new Error('kaputt')),
    putProgressBatch: () => Promise.reject(new Error('kaputt')),
    clearProgress: () => Promise.reject(new Error('kaputt')),
  };

  it('meldet einen Hinweis statt den Aufruf scheitern zu lassen', async () => {
    const onProblem = vi.fn();
    const store = createResilientStore(failing, onProblem);

    await expect(store.saveProgress(makeProgress('l1', 'haus|house'))).resolves.toBeUndefined();
    expect(onProblem).toHaveBeenCalledTimes(1);
    expect(onProblem.mock.calls[0]?.[0]).toContain('nicht dauerhaft gesichert');
  });

  it('liefert beim Lesefehler einen leeren Stand und meldet ihn', async () => {
    const onProblem = vi.fn();
    const store = createResilientStore(failing, onProblem);

    expect(await store.listLists()).toEqual([]);
    expect(await store.listProgress('l1')).toEqual([]);
    expect(onProblem).toHaveBeenCalledTimes(2);
  });

  it('meldet nichts, solange der Speicher funktioniert', async () => {
    const onProblem = vi.fn();
    const store = createResilientStore(createMemoryStore(), onProblem);

    await store.saveList(makeList('l1'));
    await store.listLists();

    expect(onProblem).not.toHaveBeenCalled();
  });
});
