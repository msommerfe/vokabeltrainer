import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { progressKey } from '../domain/entryKey';
import type { ProgressRecord, VocabList } from '../domain/types';
import { StorageUnavailableError, type VocabStore } from './types';

const DB_NAME = 'vokabeltrainer';
const DB_VERSION = 1;

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

  return {
    async listLists() {
      const all = await (await db()).getAll('lists');
      return all.sort((left, right) => left.importedAt - right.importedAt);
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
  };
}
