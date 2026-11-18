import { isLearned, type ProgressIndex } from './progress';
import type { Direction, VocabEntry } from './types';

/** Alle Wörter, die in dieser Richtung noch nicht als gelernt gelten. */
export function openEntries(
  entries: readonly VocabEntry[],
  index: ProgressIndex,
  listId: string,
  direction: Direction,
): VocabEntry[] {
  return entries.filter((entry) => !isLearned(index, listId, entry.key, direction));
}

/**
 * Zieht die nächste Karte gleichverteilt aus den offenen Wörtern. Ein Wort darf
 * wiederkommen, bevor alle anderen dran waren, aber nicht direkt hintereinander,
 * solange noch ein anderes Wort offen ist.
 */
export function drawNext<T extends { key: string }>(
  open: readonly T[],
  previousKey?: string,
  random: () => number = Math.random,
): T | undefined {
  const candidates =
    open.length > 1 ? open.filter((entry) => entry.key !== previousKey) : open;
  return candidates[Math.floor(random() * candidates.length)];
}

/** Zählwerk einer laufenden Sitzung. */
export interface SessionTally {
  known: number;
  unknown: number;
  newlyLearned: string[];
}

export function emptyTally(): SessionTally {
  return { known: 0, unknown: 0, newlyLearned: [] };
}
