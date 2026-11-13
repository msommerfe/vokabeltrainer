import type { Direction } from './types';

/**
 * Normalisiert ein Wort für den Vergleich: Unicode-Normalform, Kleinschreibung,
 * zusammengefasste Leerräume.
 */
function normalizeWord(word: string): string {
  return word.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('de');
}

/**
 * Leitet einen über Importe hinweg stabilen Schlüssel aus dem Wortpaar ab.
 * Beispiele fließen bewusst nicht ein, damit nachgetragene Beispiele den
 * Lernfortschritt nicht entwerten.
 */
export function deriveEntryKey(wordA: string, wordB: string): string {
  return `${escapeSeparator(normalizeWord(wordA))}|${escapeSeparator(normalizeWord(wordB))}`;
}

/** Schützt das Trennzeichen, damit Wörter mit "|" keine Kollision erzeugen. */
function escapeSeparator(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
}

/** Adressiert den Lernstand eines Wortes in genau einer Richtung. */
export function progressKey(listId: string, entryKey: string, direction: Direction): string {
  return `${listId}::${direction}::${entryKey}`;
}
