import { exerciseProgressKey } from './entryKey';
import type { Exercise, ExerciseProgressRecord } from './types';

/** Lösungsstand einer Liste, adressiert über `exerciseProgressKey`. */
export type ExerciseProgressIndex = ReadonlyMap<string, ExerciseProgressRecord>;

export function indexExerciseProgress(
  records: readonly ExerciseProgressRecord[],
): Map<string, ExerciseProgressRecord> {
  return new Map(
    records.map((record) => [exerciseProgressKey(record.listId, record.exerciseKey), record]),
  );
}

export function isSolved(
  index: ExerciseProgressIndex,
  listId: string,
  exerciseKey: string,
  threshold: number,
): boolean {
  return (index.get(exerciseProgressKey(listId, exerciseKey))?.streak ?? 0) >= threshold;
}

/** Eine richtige Antwort erhöht den Zähler, eine falsche setzt ihn auf null. */
export function applyExerciseResult(
  previous: ExerciseProgressRecord | undefined,
  correct: boolean,
  context: { listId: string; exerciseKey: string; now: number },
): ExerciseProgressRecord {
  return {
    listId: context.listId,
    exerciseKey: context.exerciseKey,
    streak: correct ? (previous?.streak ?? 0) + 1 : 0,
    updatedAt: context.now,
  };
}

export function openExercises(
  exercises: readonly Exercise[],
  index: ExerciseProgressIndex,
  listId: string,
  threshold: number,
): Exercise[] {
  return exercises.filter((exercise) => !isSolved(index, listId, exercise.key, threshold));
}

export interface ExerciseSummary {
  solved: number;
  open: number;
  total: number;
}

export function summarizeExercises(
  exercises: readonly Exercise[],
  index: ExerciseProgressIndex,
  listId: string,
  threshold: number,
): ExerciseSummary {
  const open = openExercises(exercises, index, listId, threshold).length;
  return { solved: exercises.length - open, open, total: exercises.length };
}

/** Behält beim Ersetzen nur den Stand der Übungen, die in der neuen Fassung noch vorkommen. */
export function pruneExerciseProgress(
  records: readonly ExerciseProgressRecord[],
  exercises: readonly Exercise[],
  listId: string,
): ExerciseProgressRecord[] {
  const keys = new Set(exercises.map((exercise) => exercise.key));
  return records
    .filter((record) => keys.has(record.exerciseKey))
    .map((record) => ({ ...record, listId }));
}

/** Kurzbezeichnung einer Übung für die Zusammenfassung. */
export function exerciseLabel(exercise: Exercise): string {
  if (exercise.kind === 'choice') {
    return exercise.question;
  }
  return exercise.parts.map((part) => part.text).join('');
}
