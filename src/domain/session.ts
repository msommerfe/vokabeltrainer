import { isLearned, type ProgressIndex } from './progress';
import type { Direction, VocabEntry } from './types';

/** Höchstzahl Karten je Durchgang, damit eine Sitzung überschaubar bleibt. */
export const MAX_ROUND_SIZE = 20;

/** Mischt eine Kopie der Liste (Fisher-Yates). */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    const current = result[index];
    const other = result[swapWith];
    if (current !== undefined && other !== undefined) {
      result[index] = other;
      result[swapWith] = current;
    }
  }
  return result;
}

/**
 * Stellt einen Durchgang zusammen: offene Wörter dieser Richtung, gemischt und
 * jedes höchstens einmal, begrenzt auf `limit` Karten.
 */
export function buildRound(
  entries: readonly VocabEntry[],
  index: ProgressIndex,
  listId: string,
  direction: Direction,
  random?: () => number,
  limit: number = MAX_ROUND_SIZE,
): VocabEntry[] {
  const open = entries.filter((entry) => !isLearned(index, listId, entry.key, direction));
  return shuffle(open, random).slice(0, limit);
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
