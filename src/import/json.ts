import {
  buildList,
  ImportError,
  type ImportOutcome,
  type RawEntry,
  type RawExample,
  type RawExercise,
} from './validate';

interface JsonShape {
  name?: unknown;
  languageA?: unknown;
  languageB?: unknown;
  entries?: unknown;
  exercises?: unknown;
}

function toRawExamples(value: unknown): RawExample[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((example) => {
    if (typeof example !== 'object' || example === null) {
      return { sentenceA: undefined, sentenceB: undefined };
    }
    const record = example as Record<string, unknown>;
    return { sentenceA: record['sentenceA'], sentenceB: record['sentenceB'] };
  });
}

/**
 * Liest eine Vokabelliste aus JSON. Eine syntaktisch ungültige Datei oder eine
 * Datei ohne Eintragsliste wird vollständig abgelehnt.
 */
export function importFromJson(text: string, fallbackName: string): ImportOutcome {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ImportError('Die Datei ist kein gültiges JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new ImportError('Die JSON-Datei muss ein Objekt mit einem Feld "entries" enthalten.');
  }

  const shape = parsed as JsonShape;
  if (!Array.isArray(shape.entries)) {
    throw new ImportError('Die JSON-Datei enthält kein Feld "entries" mit einer Liste.');
  }

  const entries: RawEntry[] = shape.entries.map((entry, index) => {
    const record =
      typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : {};
    return {
      position: index + 1,
      wordA: record['wordA'],
      wordB: record['wordB'],
      examples: toRawExamples(record['examples']),
    };
  });

  return buildList(
    {
      name: shape.name,
      languageA: shape.languageA,
      languageB: shape.languageB,
      entries,
      exercises: toRawExercises(shape.exercises),
    },
    fallbackName,
  );
}

function toRawExercises(value: unknown): RawExercise[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new ImportError('Das Feld "exercises" muss eine Liste sein.');
  }
  return value.map((exercise, index) => {
    const record =
      typeof exercise === 'object' && exercise !== null
        ? (exercise as Record<string, unknown>)
        : {};
    return {
      position: index + 1,
      type: record['type'],
      sentence: record['sentence'],
      question: record['question'],
      options: record['options'],
      answer: record['answer'],
      explanation: record['explanation'],
    };
  });
}
