import Papa from 'papaparse';
import { DEFAULT_LANGUAGE_A, DEFAULT_LANGUAGE_B } from '../domain/types';
import {
  buildList,
  ImportError,
  type ImportOutcome,
  type RawEntry,
  type RawExample,
} from './validate';

const WORD_A_ALIASES = new Set(['worta', 'wort_a', 'a', 'sprachea', 'sprache_a', 'word_a']);
const WORD_B_ALIASES = new Set(['wortb', 'wort_b', 'b', 'spracheb', 'sprache_b', 'word_b']);

const EXAMPLE_A_PATTERN = /^(?:beispiel|example)_a_(\d+)$/;
const EXAMPLE_B_PATTERN = /^(?:beispiel|example)_b_(\d+)$/;

function normalizeHeader(header: string): string {
  return header.normalize('NFC').trim().toLocaleLowerCase('de').replace(/\s+/g, '_');
}

interface ColumnLayout {
  wordAField: string;
  wordBField: string;
  languageA: string;
  languageB: string;
  examplePairs: { aField: string; bField: string }[];
}

function resolveColumns(fields: string[]): ColumnLayout {
  const normalized = fields.map(normalizeHeader);

  const aliasIndexA = normalized.findIndex((name) => WORD_A_ALIASES.has(name));
  const aliasIndexB = normalized.findIndex((name) => WORD_B_ALIASES.has(name));

  // Ohne bekannte Spaltennamen gelten die ersten beiden Spalten als Wortspalten.
  const indexA = aliasIndexA >= 0 ? aliasIndexA : 0;
  const indexB = aliasIndexB >= 0 ? aliasIndexB : 1;

  const wordAField = fields[indexA];
  const wordBField = fields[indexB];
  if (wordAField === undefined || wordBField === undefined || indexA === indexB) {
    throw new ImportError('Die CSV-Datei braucht je eine Spalte für Sprache A und Sprache B.');
  }

  const exampleA = new Map<string, string>();
  const exampleB = new Map<string, string>();
  fields.forEach((field, index) => {
    const name = normalized[index];
    if (name === undefined) {
      return;
    }
    const matchA = EXAMPLE_A_PATTERN.exec(name);
    if (matchA?.[1] !== undefined) {
      exampleA.set(matchA[1], field);
      return;
    }
    const matchB = EXAMPLE_B_PATTERN.exec(name);
    if (matchB?.[1] !== undefined) {
      exampleB.set(matchB[1], field);
    }
  });

  const examplePairs = [...exampleA.entries()]
    .sort((left, right) => Number(left[0]) - Number(right[0]))
    .flatMap(([slot, aField]) => {
      const bField = exampleB.get(slot);
      return bField === undefined ? [] : [{ aField, bField }];
    });

  // Aussagekräftige Spaltenüberschriften dienen zugleich als Sprachbezeichnung.
  const headerA = wordAField.trim();
  const headerB = wordBField.trim();
  const languageA =
    aliasIndexA >= 0 || headerA.length === 0 ? DEFAULT_LANGUAGE_A : headerA;
  const languageB =
    aliasIndexB >= 0 || headerB.length === 0 ? DEFAULT_LANGUAGE_B : headerB;

  return { wordAField, wordBField, languageA, languageB, examplePairs };
}

/**
 * Liest eine Vokabelliste aus CSV. Einzelne unvollständige Zeilen werden
 * übersprungen und mit ihrer Zeilennummer gemeldet; eine Datei ohne verwertbare
 * Zeile wird abgelehnt.
 */
export function importFromCsv(text: string, fallbackName: string): ImportOutcome {
  const parsed = Papa.parse<Record<string, string | undefined>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
  });

  const fields = parsed.meta.fields;
  if (fields === undefined || fields.length < 2) {
    throw new ImportError('Die CSV-Datei braucht eine Kopfzeile mit mindestens zwei Spalten.');
  }

  const layout = resolveColumns(fields);

  const entries: RawEntry[] = parsed.data.map((row, index) => {
    const examples: RawExample[] = layout.examplePairs.map((pair) => ({
      sentenceA: row[pair.aField],
      sentenceB: row[pair.bField],
    }));
    return {
      // Zeile 1 ist die Kopfzeile, die Daten beginnen bei Zeile 2.
      position: index + 2,
      wordA: row[layout.wordAField],
      wordB: row[layout.wordBField],
      examples,
    };
  });

  return buildList(
    {
      languageA: layout.languageA,
      languageB: layout.languageB,
      entries,
    },
    fallbackName,
  );
}
