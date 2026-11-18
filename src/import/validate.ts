import { deriveChoiceKey, deriveEntryKey, deriveGapKey } from '../domain/entryKey';
import {
  DEFAULT_LANGUAGE_A,
  DEFAULT_LANGUAGE_B,
  type Exercise,
  type GapPart,
  type VocabEntry,
  type VocabExample,
  type VocabList,
} from '../domain/types';

/** Ein übersprungener Eintrag mit seiner Position in der Quelldatei. */
export interface ImportIssue {
  /** 1-basierte Position: Zeilennummer bei CSV, Eintragsnummer bei JSON. */
  position: number;
  reason: string;
  /** Gesetzt, wenn sich die Position auf den Übungsblock bezieht. */
  scope?: 'exercise';
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
  exercises?: RawExercise[];
}

export interface RawExercise {
  position: number;
  type: unknown;
  sentence: unknown;
  question: unknown;
  options: unknown;
  answer: unknown;
  explanation: unknown;
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
 * Zerlegt einen Satz mit `{…}`-markierten Lücken in Text- und Lückenstücke.
 * Liefert bei ungültiger Markierung den Grund als Text.
 */
export function parseGapSentence(sentence: string): GapPart[] | string {
  const parts: GapPart[] = [];
  let buffer = '';
  let inGap = false;

  for (const char of sentence) {
    if (char === '{') {
      if (inGap) {
        return 'Lücken dürfen nicht verschachtelt sein';
      }
      if (buffer.length > 0) {
        parts.push({ kind: 'text', text: buffer });
      }
      buffer = '';
      inGap = true;
    } else if (char === '}') {
      if (!inGap) {
        return 'Schließende Klammer ohne öffnende';
      }
      const word = buffer.trim();
      if (word.length === 0) {
        return 'Leere Lücke';
      }
      parts.push({ kind: 'gap', text: word });
      buffer = '';
      inGap = false;
    } else {
      buffer += char;
    }
  }

  if (inGap) {
    return 'Lücke ist nicht geschlossen';
  }
  if (buffer.length > 0) {
    parts.push({ kind: 'text', text: buffer });
  }
  if (!parts.some((part) => part.kind === 'gap')) {
    return 'Keine Lücke markiert';
  }
  return parts;
}

function withExplanation<T extends object>(exercise: T, raw: unknown): T & { explanation?: string } {
  const explanation = asText(raw);
  return explanation.length > 0 ? { ...exercise, explanation } : exercise;
}

function validateExercise(raw: RawExercise): Exercise | string {
  if (raw.type === 'gap') {
    const sentence = asText(raw.sentence);
    if (sentence.length === 0) {
      return 'Satz fehlt';
    }
    const parts = parseGapSentence(sentence);
    if (typeof parts === 'string') {
      return parts;
    }
    return withExplanation({ kind: 'gap' as const, key: deriveGapKey(parts), parts }, raw.explanation);
  }

  if (raw.type === 'choice') {
    const question = asText(raw.question);
    if (question.length === 0) {
      return 'Frage fehlt';
    }
    if (!Array.isArray(raw.options)) {
      return 'Antwortmöglichkeiten fehlen';
    }
    const options = raw.options.map(asText);
    if (options.length < 2) {
      return 'Weniger als zwei Antwortmöglichkeiten';
    }
    if (options.some((option) => option.length === 0)) {
      return 'Leere Antwortmöglichkeit';
    }
    if (new Set(options.map((option) => option.toLocaleLowerCase('de'))).size !== options.length) {
      return 'Doppelte Antwortmöglichkeit';
    }
    const answer = asText(raw.answer);
    const answerIndex = options.findIndex(
      (option) => option.toLocaleLowerCase('de') === answer.toLocaleLowerCase('de'),
    );
    if (answer.length === 0 || answerIndex < 0) {
      return 'Richtige Antwort ist keine der Antwortmöglichkeiten';
    }
    return withExplanation(
      {
        kind: 'choice' as const,
        key: deriveChoiceKey(question, answer),
        question,
        options,
        answerIndex,
      },
      raw.explanation,
    );
  }

  return typeof raw.type === 'string' && raw.type.length > 0
    ? `Unbekannter Übungstyp "${raw.type}"`
    : 'Übungstyp fehlt';
}

export interface ExerciseValidationResult {
  exercises: Exercise[];
  issues: ImportIssue[];
}

/** Prüft jede Übung einzeln; fehlerhafte werden mit Position gemeldet, nicht importiert. */
export function validateExercises(raw: readonly RawExercise[]): ExerciseValidationResult {
  const exercises: Exercise[] = [];
  const issues: ImportIssue[] = [];
  const seenKeys = new Map<string, number>();

  for (const candidate of raw) {
    const result = validateExercise(candidate);
    if (typeof result === 'string') {
      issues.push({ position: candidate.position, reason: result, scope: 'exercise' });
      continue;
    }
    const firstSeenAt = seenKeys.get(result.key);
    if (firstSeenAt !== undefined) {
      issues.push({
        position: candidate.position,
        reason: `Doppelte Übung, bereits an Position ${firstSeenAt}`,
        scope: 'exercise',
      });
      continue;
    }
    seenKeys.set(result.key, candidate.position);
    exercises.push(result);
  }

  return { exercises, issues };
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

  const checked = validateExercises(raw.exercises ?? []);

  return {
    list: {
      id: crypto.randomUUID(),
      name: textOr(raw.name, fallbackName),
      languageA: textOr(raw.languageA, DEFAULT_LANGUAGE_A),
      languageB: textOr(raw.languageB, DEFAULT_LANGUAGE_B),
      entries,
      exercises: checked.exercises,
      importedAt: Date.now(),
    },
    issues: [...issues, ...checked.issues],
  };
}
