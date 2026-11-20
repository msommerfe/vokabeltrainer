import { exerciseProgressKey, progressKey } from '../domain/entryKey';
import type { ExerciseProgressRecord, ProgressRecord, VocabList } from '../domain/types';
import { normalizeExerciseRecord, normalizeStoredList } from './operations';
import type { VocabStore } from './types';

/** Speicher im Arbeitsspeicher — für Tests und als Rückfallebene ohne IndexedDB. */
export function createMemoryStore(): VocabStore {
  const lists = new Map<string, VocabList>();
  const progress = new Map<string, ProgressRecord>();
  const exerciseProgress = new Map<string, ExerciseProgressRecord>();

  const keyOf = (record: ProgressRecord): string =>
    progressKey(record.listId, record.entryKey, record.direction);
  const exerciseKeyOf = (record: ExerciseProgressRecord): string =>
    exerciseProgressKey(record.listId, record.exerciseKey);

  return {
    async listLists() {
      return [...lists.values()]
        .map(normalizeStoredList)
        .sort((left, right) => left.importedAt - right.importedAt);
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
    async listExerciseProgress(listId) {
      return [...exerciseProgress.values()]
        .filter((record) => record.listId === listId)
        .map(normalizeExerciseRecord);
    },
    async saveExerciseProgress(record) {
      exerciseProgress.set(exerciseKeyOf(record), record);
    },
    async putExerciseProgressBatch(records) {
      for (const record of records) {
        exerciseProgress.set(exerciseKeyOf(record), record);
      }
    },
    async clearExerciseProgress(listId) {
      for (const [key, record] of exerciseProgress) {
        if (record.listId === listId) {
          exerciseProgress.delete(key);
        }
      }
    },
  };
}
