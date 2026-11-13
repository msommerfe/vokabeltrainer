import type { ProgressRecord, VocabList } from '../domain/types';

/** Persistenz für Vokabellisten und Lernfortschritt. */
export interface VocabStore {
  listLists(): Promise<VocabList[]>;
  saveList(list: VocabList): Promise<void>;
  deleteList(listId: string): Promise<void>;
  listProgress(listId: string): Promise<ProgressRecord[]>;
  saveProgress(record: ProgressRecord): Promise<void>;
  putProgressBatch(records: ProgressRecord[]): Promise<void>;
  clearProgress(listId: string): Promise<void>;
}

/** Signalisiert, dass der Gerätespeicher nicht verfügbar oder voll ist. */
export class StorageUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'StorageUnavailableError';
  }
}
