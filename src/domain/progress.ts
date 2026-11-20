import { progressKey } from './entryKey';
import { DEFAULT_SETTINGS } from './settings';
import type { Direction, ProgressRecord, Rating, VocabEntry } from './types';

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

/** Gelernt ergibt sich aus Zähler und aktueller Schwelle, damit Schwellenänderungen sofort wirken. */
export function isLearned(
  index: ProgressIndex,
  listId: string,
  entryKey: string,
  direction: Direction,
  threshold: number,
): boolean {
  return streakOf(index, listId, entryKey, direction) >= threshold;
}

/** Meldet, ob ein Zählerwechsel die Schwelle gerade erreicht hat. */
export function crossedThreshold(
  previousStreak: number,
  nextStreak: number,
  threshold: number,
): boolean {
  return previousStreak < threshold && nextStreak >= threshold;
}

/**
 * Wendet eine Bewertung auf den Lernstand an: "gewusst" erhöht die Serie,
 * "nicht gewusst" setzt sie auf null zurück.
 */
export function applyRating(
  previous: ProgressRecord | undefined,
  rating: Rating,
  context: { listId: string; entryKey: string; direction: Direction; now: number },
  threshold: number = DEFAULT_SETTINGS.vocab.threshold,
): ProgressRecord {
  const streak = rating === 'known' ? (previous?.streak ?? 0) + 1 : 0;

  return {
    listId: context.listId,
    entryKey: context.entryKey,
    direction: context.direction,
    streak,
    // Wird nicht mehr gelesen; bleibt für ältere App-Versionen erhalten.
    learned: streak >= threshold,
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
  threshold: number,
): ProgressSummary {
  let learned = 0;
  for (const entry of entries) {
    if (isLearned(index, listId, entry.key, direction, threshold)) {
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
