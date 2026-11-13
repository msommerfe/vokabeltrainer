import type { VocabStore } from './types';

/** Entfernt eine Liste zusammen mit ihrem gesamten Lernfortschritt. */
export async function removeListCompletely(store: VocabStore, listId: string): Promise<void> {
  await store.clearProgress(listId);
  await store.deleteList(listId);
}
