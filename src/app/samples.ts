import type { VocabList } from '../domain/types';
import { replaceList } from '../storage/operations';
import type { VocabStore } from '../storage/types';

/** Bei jeder inhaltlichen Änderung der Dateien unter `public/samples/` erhöhen. */
export const SAMPLES_VERSION = 2;

/** Ab dieser Version tragen mitgelieferte Listen ihre Herkunft in `sampleFile`. */
const FIRST_VERSION_WITH_SAMPLE_FILE = 2;

export interface SampleFile {
  file: string;
  name: string;
}

export const SAMPLE_FILES: readonly SampleFile[] = [
  { file: 'spanisch-grundwortschatz.json', name: 'Spanisch Grundwortschatz' },
  { file: 'spanisch-alltagswoerter.json', name: 'Spanisch Alltagswörter' },
  { file: 'spanisch-aufbauwortschatz.json', name: 'Spanisch Aufbauwortschatz' },
];

export interface SampleSyncDeps {
  /** Zuletzt eingespielte Version, `undefined` bei einer neuen Installation. */
  readVersion: () => number | undefined;
  writeVersion: (version: number) => void;
  /** Lädt eine mitgelieferte Liste; `undefined`, wenn sie nicht verfügbar ist. */
  loadSample: (sample: SampleFile) => Promise<VocabList | undefined>;
}

/**
 * Legt die mitgelieferten Listen beim ersten Start an und bringt vorhandene
 * auf den aktuellen Stand. Gelöschte Listen werden nicht wieder angelegt.
 */
export async function syncSamples(store: VocabStore, deps: SampleSyncDeps): Promise<void> {
  const stored = deps.readVersion();
  if (stored !== undefined && stored >= SAMPLES_VERSION) {
    return;
  }

  const lists = await store.listLists();
  const firstStart = stored === undefined && lists.length === 0;
  const matchByName = stored === undefined || stored < FIRST_VERSION_WITH_SAMPLE_FILE;
  // Vor dem Laden setzen: Ein Neuladen mitten im Abgleich darf keine Duplikate erzeugen.
  deps.writeVersion(SAMPLES_VERSION);

  for (const sample of SAMPLE_FILES) {
    const loaded = await deps.loadSample(sample);
    if (loaded === undefined) {
      continue;
    }

    const existing =
      lists.find((list) => list.sampleFile === sample.file) ??
      (matchByName
        ? lists.find((list) => list.sampleFile === undefined && list.name === sample.name)
        : undefined);

    if (existing !== undefined) {
      await replaceList(store, existing.id, {
        ...loaded,
        sampleFile: sample.file,
        importedAt: existing.importedAt,
      });
    } else if (firstStart) {
      await store.saveList({ ...loaded, sampleFile: sample.file });
    }
  }
}
