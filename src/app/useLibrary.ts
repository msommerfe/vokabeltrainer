import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { progressKey } from '../domain/entryKey';
import {
  applyRating,
  indexProgress,
  pruneProgressToEntries,
  rebaseProgressToList,
} from '../domain/progress';
import type { Direction, ProgressRecord, Rating, VocabList } from '../domain/types';
import type { ImportIssue, ImportOutcome } from '../import/validate';
import { createIndexedDbStore } from '../storage/indexeddb';
import { createMemoryStore } from '../storage/memory';
import { removeListCompletely } from '../storage/operations';
import { createResilientStore } from '../storage/resilient';
import type { VocabStore } from '../storage/types';
import { importFileContent } from './importFile';

const SEEDED_FLAG = 'vokabeltrainer.samples-seeded';

const SAMPLE_FILES: readonly { file: string; name: string }[] = [
  { file: 'spanisch-grundwortschatz.json', name: 'Spanisch Grundwortschatz' },
  { file: 'spanisch-alltagswoerter.json', name: 'Spanisch Alltagswörter' },
  { file: 'spanisch-aufbauwortschatz.json', name: 'Spanisch Aufbauwortschatz' },
];

export interface ImportSummary {
  listName: string;
  imported: number;
  issues: ImportIssue[];
}

export interface RateOutcome {
  newlyLearned: boolean;
}

export interface Library {
  ready: boolean;
  lists: VocabList[];
  progress: ReadonlyMap<string, ProgressRecord>;
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
  resetList: (listId: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
}

function hasPersistentFlag(): boolean {
  try {
    return localStorage.getItem(SEEDED_FLAG) === '1';
  } catch {
    return false;
  }
}

function setPersistentFlag(): void {
  try {
    localStorage.setItem(SEEDED_FLAG, '1');
  } catch {
    // Ohne localStorage werden die Beispiellisten erneut angeboten; das ist unkritisch.
  }
}

// Modulweit, damit doppelt ausgeführte Effekte (StrictMode) die Listen nicht zweimal anlegen.
let seeding: Promise<void> | undefined;

function ensureSamples(store: VocabStore): Promise<void> {
  seeding ??= (async () => {
    if (hasPersistentFlag() || (await store.listLists()).length > 0) {
      return;
    }
    // Flag vor dem Laden setzen: Ein Neuladen mitten im Import darf keine Duplikate erzeugen.
    setPersistentFlag();

    for (const sample of SAMPLE_FILES) {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}samples/${sample.file}`);
        if (!response.ok) {
          continue;
        }
        await store.saveList(importFileContent(sample.file, await response.text(), sample.name).list);
      } catch {
        // Ohne Beispielliste bleibt die App nutzbar; eigene Listen sind weiterhin importierbar.
      }
    }
  })();

  return seeding;
}

export function useLibrary(): Library {
  const [ready, setReady] = useState(false);
  const [lists, setLists] = useState<VocabList[]>([]);
  const [progress, setProgress] = useState<ReadonlyMap<string, ProgressRecord>>(new Map());
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const noticeRef = useRef(setNotice);
  noticeRef.current = setNotice;

  // Bewertungen können schneller eintreffen als React neu rendert; die Ref hält den aktuellen Stand.
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const store: VocabStore = useMemo(() => {
    const inner = typeof indexedDB === 'undefined' ? createMemoryStore() : createIndexedDbStore();
    return createResilientStore(inner, (message) => noticeRef.current(message));
  }, []);

  const refresh = useCallback(async () => {
    const loaded = await store.listLists();
    const records = await Promise.all(loaded.map((list) => store.listProgress(list.id)));
    setLists(loaded);
    setProgress(indexProgress(records.flat()));
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
        // Fortschritt unveränderter Wörter übernehmen, neue Wörter starten bei 0.
        const previous = await store.listProgress(replaceListId);
        const kept = rebaseProgressToList(
          pruneProgressToEntries(previous, outcome.list.entries),
          outcome.list.id,
        );
        await removeListCompletely(store, replaceListId);
        await store.saveList(outcome.list);
        await store.putProgressBatch(kept);
      } else {
        await store.saveList(outcome.list);
      }

      await refresh();
      return {
        listName: outcome.list.name,
        imported: outcome.list.entries.length,
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

  const resetList = useCallback(
    async (listId: string) => {
      await store.clearProgress(listId);
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
    notice,
    dismissNotice,
    importOutcome,
    readFile,
    rate,
    resetList,
    deleteList,
  };
}
