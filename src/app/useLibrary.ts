import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { exerciseProgressKey, progressKey } from '../domain/entryKey';
import { applyExerciseResult, indexExerciseProgress } from '../domain/exercises';
import { applyRating, indexProgress } from '../domain/progress';
import type {
  Direction,
  ExerciseProgressRecord,
  ProgressRecord,
  Rating,
  VocabList,
} from '../domain/types';
import type { ImportIssue, ImportOutcome } from '../import/validate';
import { createIndexedDbStore } from '../storage/indexeddb';
import { createMemoryStore } from '../storage/memory';
import { removeListCompletely, replaceList } from '../storage/operations';
import { createResilientStore } from '../storage/resilient';
import type { VocabStore } from '../storage/types';
import { importFileContent } from './importFile';
import { syncSamples } from './samples';

const VERSION_KEY = 'vokabeltrainer.samples-version';
/** Kennzeichen der ersten App-Version, die nur "eingespielt ja/nein" kannte. */
const LEGACY_SEEDED_FLAG = 'vokabeltrainer.samples-seeded';

export interface ImportSummary {
  listName: string;
  imported: number;
  exercises: number;
  issues: ImportIssue[];
}

export interface RateOutcome {
  newlyLearned: boolean;
}

export interface ExerciseOutcome {
  newlySolved: boolean;
}

export interface Library {
  ready: boolean;
  lists: VocabList[];
  progress: ReadonlyMap<string, ProgressRecord>;
  exerciseProgress: ReadonlyMap<string, ExerciseProgressRecord>;
  notice: string | undefined;
  dismissNotice: () => void;
  importOutcome: (outcome: ImportOutcome, replaceListId?: string) => Promise<ImportSummary>;
  readFile: (file: File) => Promise<ImportOutcome>;
  rate: (
    listId: string,
    entryKey: string,
    direction: Direction,
    rating: Rating,
  ) => Promise<RateOutcome>;
  answerExercise: (
    listId: string,
    exerciseKey: string,
    correct: boolean,
  ) => Promise<ExerciseOutcome>;
  resetList: (listId: string) => Promise<void>;
  resetExercises: (listId: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
}

function readSamplesVersion(): number | undefined {
  try {
    const stored = Number(localStorage.getItem(VERSION_KEY));
    if (Number.isInteger(stored) && stored > 0) {
      return stored;
    }
    return localStorage.getItem(LEGACY_SEEDED_FLAG) === '1' ? 1 : undefined;
  } catch {
    return undefined;
  }
}

function writeSamplesVersion(version: number): void {
  try {
    localStorage.setItem(VERSION_KEY, String(version));
  } catch {
    // Ohne localStorage wird der Abgleich beim nächsten Start wiederholt; das ist unkritisch.
  }
}

// Modulweit, damit doppelt ausgeführte Effekte (StrictMode) die Listen nicht zweimal anlegen.
let seeding: Promise<void> | undefined;

function ensureSamples(store: VocabStore): Promise<void> {
  seeding ??= syncSamples(store, {
    readVersion: readSamplesVersion,
    writeVersion: writeSamplesVersion,
    loadSample: async (sample) => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}samples/${sample.file}`);
        if (!response.ok) {
          return undefined;
        }
        return importFileContent(sample.file, await response.text(), sample.name).list;
      } catch {
        // Ohne Beispielliste bleibt die App nutzbar; eigene Listen sind weiterhin importierbar.
        return undefined;
      }
    },
  });

  return seeding;
}

export function useLibrary(): Library {
  const [ready, setReady] = useState(false);
  const [lists, setLists] = useState<VocabList[]>([]);
  const [progress, setProgress] = useState<ReadonlyMap<string, ProgressRecord>>(new Map());
  const [exerciseProgress, setExerciseProgress] = useState<
    ReadonlyMap<string, ExerciseProgressRecord>
  >(new Map());
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const noticeRef = useRef(setNotice);
  noticeRef.current = setNotice;

  // Bewertungen können schneller eintreffen als React neu rendert; die Ref hält den aktuellen Stand.
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const exerciseProgressRef = useRef(exerciseProgress);
  exerciseProgressRef.current = exerciseProgress;

  const store: VocabStore = useMemo(() => {
    const inner = typeof indexedDB === 'undefined' ? createMemoryStore() : createIndexedDbStore();
    return createResilientStore(inner, (message) => noticeRef.current(message));
  }, []);

  const refresh = useCallback(async () => {
    const loaded = await store.listLists();
    const records = await Promise.all(loaded.map((list) => store.listProgress(list.id)));
    const exerciseRecords = await Promise.all(
      loaded.map((list) => store.listExerciseProgress(list.id)),
    );
    setLists(loaded);
    setProgress(indexProgress(records.flat()));
    setExerciseProgress(indexExerciseProgress(exerciseRecords.flat()));
  }, [store]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await ensureSamples(store);
      if (!cancelled) {
        await refresh();
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [store, refresh]);

  const readFile = useCallback(async (file: File): Promise<ImportOutcome> => {
    return importFileContent(file.name, await file.text());
  }, []);

  const importOutcome = useCallback(
    async (outcome: ImportOutcome, replaceListId?: string): Promise<ImportSummary> => {
      if (replaceListId !== undefined) {
        await replaceList(store, replaceListId, outcome.list);
      } else {
        await store.saveList(outcome.list);
      }

      await refresh();
      return {
        listName: outcome.list.name,
        imported: outcome.list.entries.length,
        exercises: outcome.list.exercises.length,
        issues: outcome.issues,
      };
    },
    [store, refresh],
  );

  const rate = useCallback(
    async (
      listId: string,
      entryKey: string,
      direction: Direction,
      rating: Rating,
    ): Promise<RateOutcome> => {
      const key = progressKey(listId, entryKey, direction);
      const previous = progressRef.current.get(key);
      const next = applyRating(previous, rating, {
        listId,
        entryKey,
        direction,
        now: Date.now(),
      });

      const updated = new Map(progressRef.current).set(key, next);
      progressRef.current = updated;
      setProgress(updated);

      // Sofort schreiben, damit der Stand auch beim vorzeitigen Verlassen erhalten bleibt.
      await store.saveProgress(next);

      return { newlyLearned: next.learned && previous?.learned !== true };
    },
    [store],
  );

  const answerExercise = useCallback(
    async (listId: string, exerciseKey: string, correct: boolean): Promise<ExerciseOutcome> => {
      const key = exerciseProgressKey(listId, exerciseKey);
      const previous = exerciseProgressRef.current.get(key);
      const next = applyExerciseResult(previous, correct, { listId, exerciseKey, now: Date.now() });

      const updated = new Map(exerciseProgressRef.current).set(key, next);
      exerciseProgressRef.current = updated;
      setExerciseProgress(updated);

      await store.saveExerciseProgress(next);

      return { newlySolved: next.solved && previous?.solved !== true };
    },
    [store],
  );

  const resetList = useCallback(
    async (listId: string) => {
      await store.clearProgress(listId);
      await refresh();
    },
    [store, refresh],
  );

  const resetExercises = useCallback(
    async (listId: string) => {
      await store.clearExerciseProgress(listId);
      await refresh();
    },
    [store, refresh],
  );

  const deleteList = useCallback(
    async (listId: string) => {
      await removeListCompletely(store, listId);
      await refresh();
    },
    [store, refresh],
  );

  const dismissNotice = useCallback(() => {
    setNotice(undefined);
  }, []);

  return {
    ready,
    lists,
    progress,
    exerciseProgress,
    notice,
    dismissNotice,
    importOutcome,
    readFile,
    rate,
    answerExercise,
    resetList,
    resetExercises,
    deleteList,
  };
}
