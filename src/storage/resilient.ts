import type { VocabStore } from './types';

const WRITE_HINT =
  'Der Fortschritt kann auf diesem Gerät nicht dauerhaft gesichert werden. Die Sitzung läuft weiter, der Stand geht beim Schließen aber verloren.';
const READ_HINT =
  'Gespeicherte Daten konnten nicht gelesen werden. Die App startet mit leerem Stand.';

/**
 * Hüllt einen Speicher so ein, dass Speicherfehler die laufende Sitzung nicht
 * abbrechen: Sie werden gemeldet, der Aufruf läuft weiter.
 */
export function createResilientStore(
  inner: VocabStore,
  onProblem: (message: string) => void,
): VocabStore {
  async function guard<T>(operation: () => Promise<T>, fallback: T, hint: string): Promise<T> {
    try {
      return await operation();
    } catch {
      onProblem(hint);
      return fallback;
    }
  }

  return {
    listLists: () => guard(() => inner.listLists(), [], READ_HINT),
    listProgress: (listId) => guard(() => inner.listProgress(listId), [], READ_HINT),
    saveList: (list) => guard(() => inner.saveList(list), undefined, WRITE_HINT),
    deleteList: (listId) => guard(() => inner.deleteList(listId), undefined, WRITE_HINT),
    saveProgress: (record) => guard(() => inner.saveProgress(record), undefined, WRITE_HINT),
    putProgressBatch: (records) =>
      guard(() => inner.putProgressBatch(records), undefined, WRITE_HINT),
    clearProgress: (listId) => guard(() => inner.clearProgress(listId), undefined, WRITE_HINT),
    listExerciseProgress: (listId) =>
      guard(() => inner.listExerciseProgress(listId), [], READ_HINT),
    saveExerciseProgress: (record) =>
      guard(() => inner.saveExerciseProgress(record), undefined, WRITE_HINT),
    putExerciseProgressBatch: (records) =>
      guard(() => inner.putExerciseProgressBatch(records), undefined, WRITE_HINT),
    clearExerciseProgress: (listId) =>
      guard(() => inner.clearExerciseProgress(listId), undefined, WRITE_HINT),
  };
}
