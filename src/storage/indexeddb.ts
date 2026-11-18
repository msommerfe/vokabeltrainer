import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { exerciseProgressKey, progressKey } from '../domain/entryKey';
import type { ExerciseProgressRecord, ProgressRecord, VocabList } from '../domain/types';
import { normalizeStoredList } from './operations';
import { StorageUnavailableError, type VocabStore } from './types';

const DB_NAME = 'vokabeltrainer';
// Version 2 ergänzt den Übungsfortschritt; bestehende Stores bleiben unverändert.
const DB_VERSION = 2;

interface VokabeltrainerDB extends DBSchema {
  lists: {
    key: string;
    value: VocabList;
  };
  progress: {
    key: string;
    value: ProgressRecord;
    indexes: { byList: string };
  };
  exerciseProgress: {
    key: string;
    value: ExerciseProgressRecord;
    indexes: { byList: string };
  };
}

async function open(): Promise<IDBPDatabase<VokabeltrainerDB>> {
  if (typeof indexedDB === 'undefined') {
    throw new StorageUnavailableError('IndexedDB steht in dieser Umgebung nicht zur Verfügung.');
  }
  try {
    return await openDB<VokabeltrainerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('lists')) {
          db.createObjectStore('lists', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('progress')) {
          const store = db.createObjectStore('progress');
          store.createIndex('byList', 'listId');
        }
        if (!db.objectStoreNames.contains('exerciseProgress')) {
          const store = db.createObjectStore('exerciseProgress');
          store.createIndex('byList', 'listId');
        }
      },
    });
  } catch (cause) {
    throw new StorageUnavailableError('Die Datenbank konnte nicht geöffnet werden.', { cause });
  }
}

/** Dauerhafte Speicherung in IndexedDB. */
export function createIndexedDbStore(): VocabStore {
  let handle: Promise<IDBPDatabase<VokabeltrainerDB>> | undefined;

  const db = (): Promise<IDBPDatabase<VokabeltrainerDB>> => {
    handle ??= open().catch((error: unknown) => {
      handle = undefined;
      throw error;
    });
    return handle;
  };

  const keyOf = (record: ProgressRecord): string =>
    progressKey(record.listId, record.entryKey, record.direction);
  const exerciseKeyOf = (record: ExerciseProgressRecord): string =>
    exerciseProgressKey(record.listId, record.exerciseKey);

  return {
    async listLists() {
      const all = await (await db()).getAll('lists');
      return all.map(normalizeStoredList).sort((left, right) => left.importedAt - right.importedAt);
    },
    async saveList(list) {
      await (await db()).put('lists', list);
    },
    async deleteList(listId) {
      await (await db()).delete('lists', listId);
    },
    async listProgress(listId) {
      return (await db()).getAllFromIndex('progress', 'byList', listId);
    },
    async saveProgress(record) {
      await (await db()).put('progress', record, keyOf(record));
    },
    async putProgressBatch(records) {
      const connection = await db();
      const tx = connection.transaction('progress', 'readwrite');
      await Promise.all(records.map((record) => tx.store.put(record, keyOf(record))));
      await tx.done;
    },
    async clearProgress(listId) {
      const connection = await db();
      const tx = connection.transaction('progress', 'readwrite');
      const keys = await tx.store.index('byList').getAllKeys(listId);
      await Promise.all(keys.map((key) => tx.store.delete(key)));
      await tx.done;
    },
    async listExerciseProgress(listId) {
      return (await db()).getAllFromIndex('exerciseProgress', 'byList', listId);
    },
    async saveExerciseProgress(record) {
      await (await db()).put('exerciseProgress', record, exerciseKeyOf(record));
    },
    async putExerciseProgressBatch(records) {
      const connection = await db();
      const tx = connection.transaction('exerciseProgress', 'readwrite');
      await Promise.all(records.map((record) => tx.store.put(record, exerciseKeyOf(record))));
      await tx.done;
    },
    async clearExerciseProgress(listId) {
      const connection = await db();
      const tx = connection.transaction('exerciseProgress', 'readwrite');
      const keys = await tx.store.index('byList').getAllKeys(listId);
      await Promise.all(keys.map((key) => tx.store.delete(key)));
      await tx.done;
    },
  };
}
