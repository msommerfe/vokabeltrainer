import { deriveEntryKey } from '../domain/entryKey';
import {
  DEFAULT_LANGUAGE_A,
  DEFAULT_LANGUAGE_B,
  type VocabEntry,
  type VocabExample,
  type VocabList,
} from '../domain/types';

/** Ein übersprungener Eintrag mit seiner Position in der Quelldatei. */
export interface ImportIssue {
  /** 1-basierte Position: Zeilennummer bei CSV, Eintragsnummer bei JSON. */
  position: number;
  reason: string;
}

/** Fehler, der zur vollständigen Ablehnung der Datei führt. */
export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportError';
  }
}

export interface RawExample {
  sentenceA: unknown;
  sentenceB: unknown;
}

export interface RawEntry {
  position: number;
  wordA: unknown;
  wordB: unknown;
  examples: RawExample[];
}

export interface RawList {
  name?: unknown;
  languageA?: unknown;
  languageB?: unknown;
  entries: RawEntry[];
}

export interface ImportOutcome {
  list: VocabList;
  issues: ImportIssue[];
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function textOr(value: unknown, fallback: string): string {
  const text = asText(value);
  return text.length > 0 ? text : fallback;
}

function validateExamples(raw: RawExample[]): VocabExample[] {
  const examples: VocabExample[] = [];
  for (const candidate of raw) {
    const sentenceA = asText(candidate.sentenceA);
    const sentenceB = asText(candidate.sentenceB);
    // Ein halbes Beispielpaar ist nicht darstellbar und wird still verworfen.
    if (sentenceA.length > 0 && sentenceB.length > 0) {
      examples.push({ sentenceA, sentenceB });
    }
  }
  return examples;
}

export interface ValidationResult {
  entries: VocabEntry[];
  issues: ImportIssue[];
}

/**
 * Gemeinsame Validierung für alle Importformate. Gültige Einträge und
 * fehlerhafte Positionen werden getrennt zurückgegeben, damit ein Teilimport
 * möglich bleibt.
 */
export function validateEntries(raw: RawEntry[]): ValidationResult {
  const entries: VocabEntry[] = [];
  const issues: ImportIssue[] = [];
  const seenKeys = new Map<string, number>();

  for (const candidate of raw) {
    const wordA = asText(candidate.wordA);
    const wordB = asText(candidate.wordB);

    if (wordA.length === 0 && wordB.length === 0) {
      issues.push({ position: candidate.position, reason: 'Beide Wörter fehlen' });
      continue;
    }
    if (wordA.length === 0) {
      issues.push({ position: candidate.position, reason: 'Wort in Sprache A fehlt' });
      continue;
    }
    if (wordB.length === 0) {
      issues.push({ position: candidate.position, reason: 'Wort in Sprache B fehlt' });
      continue;
    }

    const key = deriveEntryKey(wordA, wordB);
    const firstSeenAt = seenKeys.get(key);
    if (firstSeenAt !== undefined) {
      issues.push({
        position: candidate.position,
        reason: `Doppelter Eintrag, bereits an Position ${firstSeenAt}`,
      });
      continue;
    }

    seenKeys.set(key, candidate.position);
    entries.push({ key, wordA, wordB, examples: validateExamples(candidate.examples) });
  }

  return { entries, issues };
}

/**
 * Baut aus einer validierten Rohliste eine Vokabelliste.
 * Wirft `ImportError`, wenn keine einzige Zeile verwertbar ist.
 */
export function buildList(raw: RawList, fallbackName: string): ImportOutcome {
  const { entries, issues } = validateEntries(raw.entries);

  if (entries.length === 0) {
    throw new ImportError('Die Datei enthält keinen einzigen gültigen Eintrag.');
  }

  return {
    list: {
      id: crypto.randomUUID(),
      name: textOr(raw.name, fallbackName),
      languageA: textOr(raw.languageA, DEFAULT_LANGUAGE_A),
      languageB: textOr(raw.languageB, DEFAULT_LANGUAGE_B),
      entries,
      importedAt: Date.now(),
    },
    issues,
  };
}
