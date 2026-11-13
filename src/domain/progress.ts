import { progressKey } from './entryKey';
import {
  LEARNED_THRESHOLD,
  type Direction,
  type ProgressRecord,
  type Rating,
  type VocabEntry,
} from './types';

/** Lernstand einer Liste, adressiert über `progressKey`. */
export type ProgressIndex = ReadonlyMap<string, ProgressRecord>;

export function indexProgress(records: readonly ProgressRecord[]): Map<string, ProgressRecord> {
  return new Map(
    records.map((record) => [progressKey(record.listId, record.entryKey, record.direction), record]),
  );
}

export function lookupProgress(
  index: ProgressIndex,
  listId: string,
  entryKey: string,
  direction: Direction,
): ProgressRecord | undefined {
  return index.get(progressKey(listId, entryKey, direction));
}

export function streakOf(
  index: ProgressIndex,
  listId: string,
  entryKey: string,
  direction: Direction,
): number {
  return lookupProgress(index, listId, entryKey, direction)?.streak ?? 0;
}

export function isLearned(
  index: ProgressIndex,
  listId: string,
  entryKey: string,
  direction: Direction,
): boolean {
  return lookupProgress(index, listId, entryKey, direction)?.learned ?? false;
}

/**
 * Wendet eine Bewertung auf den Lernstand an: "gewusst" erhöht die Serie,
 * "nicht gewusst" setzt sie auf null zurück.
 */
export function applyRating(
  previous: ProgressRecord | undefined,
  rating: Rating,
  context: { listId: string; entryKey: string; direction: Direction; now: number },
): ProgressRecord {
  const streak = rating === 'known' ? (previous?.streak ?? 0) + 1 : 0;

  return {
    listId: context.listId,
    entryKey: context.entryKey,
    direction: context.direction,
    streak,
    learned: streak >= LEARNED_THRESHOLD,
    updatedAt: context.now,
  };
}

export interface ProgressSummary {
  learned: number;
  open: number;
  total: number;
}

/** Zählt gelernte und offene Wörter einer Liste in einer Richtung. */
export function summarizeProgress(
  entries: readonly VocabEntry[],
  index: ProgressIndex,
  listId: string,
  direction: Direction,
): ProgressSummary {
  let learned = 0;
  for (const entry of entries) {
    if (isLearned(index, listId, entry.key, direction)) {
      learned += 1;
    }
  }
  return { learned, open: entries.length - learned, total: entries.length };
}

/**
 * Behält bei einem erneuten Import nur den Fortschritt der Wörter, die in der
 * neuen Fassung noch vorkommen. Neue Wörter beginnen damit bei null.
 */
export function pruneProgressToEntries(
  records: readonly ProgressRecord[],
  entries: readonly VocabEntry[],
): ProgressRecord[] {
  const keys = new Set(entries.map((entry) => entry.key));
  return records.filter((record) => keys.has(record.entryKey));
}

/** Überträgt den Fortschritt einer ersetzten Liste auf die neue Listen-Id. */
export function rebaseProgressToList(
  records: readonly ProgressRecord[],
  listId: string,
): ProgressRecord[] {
  return records.map((record) => ({ ...record, listId }));
}
