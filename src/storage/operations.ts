import { pruneExerciseProgress } from '../domain/exercises';
import { pruneProgressToEntries, rebaseProgressToList } from '../domain/progress';
import type { VocabList } from '../domain/types';
import type { VocabStore } from './types';

/** Entfernt eine Liste zusammen mit ihrem gesamten Lern- und Übungsfortschritt. */
export async function removeListCompletely(store: VocabStore, listId: string): Promise<void> {
  await store.clearProgress(listId);
  await store.clearExerciseProgress(listId);
  await store.deleteList(listId);
}

/**
 * Ersetzt eine Liste durch eine neue Fassung. Der Fortschritt unveränderter
 * Wörter und Übungen wird übernommen; neue beginnen offen.
 */
export async function replaceList(
  store: VocabStore,
  previousListId: string,
  next: VocabList,
): Promise<void> {
  const progress = await store.listProgress(previousListId);
  const exerciseProgress = await store.listExerciseProgress(previousListId);
  const keptProgress = rebaseProgressToList(pruneProgressToEntries(progress, next.entries), next.id);
  const keptExercises = pruneExerciseProgress(exerciseProgress, next.exercises, next.id);

  await removeListCompletely(store, previousListId);
  await store.saveList(next);
  await store.putProgressBatch(keptProgress);
  await store.putExerciseProgressBatch(keptExercises);
}

/** Ergänzt Felder, die in früher gespeicherten Listen fehlen. */
export function normalizeStoredList(list: VocabList): VocabList {
  return Array.isArray(list.exercises) ? list : { ...list, exercises: [] };
}
