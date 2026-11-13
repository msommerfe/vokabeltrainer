import { progressKey } from '../domain/entryKey';
import type { ProgressRecord, VocabList } from '../domain/types';
import type { VocabStore } from './types';

/** Speicher im Arbeitsspeicher — für Tests und als Rückfallebene ohne IndexedDB. */
export function createMemoryStore(): VocabStore {
  const lists = new Map<string, VocabList>();
  const progress = new Map<string, ProgressRecord>();

  const keyOf = (record: ProgressRecord): string =>
    progressKey(record.listId, record.entryKey, record.direction);

  return {
    async listLists() {
      return [...lists.values()].sort((left, right) => left.importedAt - right.importedAt);
    },
    async saveList(list) {
      lists.set(list.id, list);
    },
    async deleteList(listId) {
      lists.delete(listId);
    },
    async listProgress(listId) {
      return [...progress.values()].filter((record) => record.listId === listId);
    },
    async saveProgress(record) {
      progress.set(keyOf(record), record);
    },
    async putProgressBatch(records) {
      for (const record of records) {
        progress.set(keyOf(record), record);
      }
    },
    async clearProgress(listId) {
      for (const [key, record] of progress) {
        if (record.listId === listId) {
          progress.delete(key);
        }
      }
    },
  };
}
