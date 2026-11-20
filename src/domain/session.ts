import { isLearned, type ProgressIndex } from './progress';
import type { Direction, VocabEntry } from './types';

/** Alle Wörter, die in dieser Richtung noch nicht als gelernt gelten. */
export function openEntries(
  entries: readonly VocabEntry[],
  index: ProgressIndex,
  listId: string,
  direction: Direction,
  threshold: number,
): VocabEntry[] {
  return entries.filter((entry) => !isLearned(index, listId, entry.key, direction, threshold));
}

/** Wählt für eine Sitzung höchstens `size` zufällige Elemente; `null` bedeutet alle. */
export function pickSession<T>(
  open: readonly T[],
  size: number | null,
  random: () => number = Math.random,
): T[] {
  if (size === null || open.length <= size) {
    return [...open];
  }
  const pool = [...open];
  for (let index = 0; index < size; index += 1) {
    const swapWith = index + Math.floor(random() * (pool.length - index));
    const chosen = pool[swapWith];
    const current = pool[index];
    if (chosen !== undefined && current !== undefined) {
      pool[index] = chosen;
      pool[swapWith] = current;
    }
  }
  return pool.slice(0, size);
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
