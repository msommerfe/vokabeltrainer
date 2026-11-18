/** Ein Beispielsatzpaar zu einem Vokabeleintrag. */
export interface VocabExample {
  sentenceA: string;
  sentenceB: string;
}

/** Ein Vokabeleintrag mit Wort in beiden Sprachen und optionalen Beispielen. */
export interface VocabEntry {
  /** Aus beiden Wörtern abgeleiteter, über Importe hinweg stabiler Schlüssel. */
  key: string;
  wordA: string;
  wordB: string;
  examples: VocabExample[];
}

/** Abfragerichtung einer Lernsitzung. */
export type Direction = 'a-to-b' | 'b-to-a';

export const DIRECTIONS: readonly Direction[] = ['a-to-b', 'b-to-a'];

/** Ein Stück eines Lückentexts: sichtbarer Text oder zu erratendes Wort. */
export type GapPart = { kind: 'text'; text: string } | { kind: 'gap'; text: string };

/** Satz mit einem oder mehreren fehlenden Wörtern. */
export interface GapExercise {
  kind: 'gap';
  key: string;
  parts: GapPart[];
  explanation?: string;
}

/** Frage mit mehreren Antwortmöglichkeiten, von denen genau eine richtig ist. */
export interface ChoiceExercise {
  kind: 'choice';
  key: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
}

export type Exercise = GapExercise | ChoiceExercise;

/** Eine benannte Vokabelliste mit Bezeichnungen für beide Sprachen. */
export interface VocabList {
  id: string;
  name: string;
  languageA: string;
  languageB: string;
  entries: VocabEntry[];
  exercises: Exercise[];
  importedAt: number;
  /** Dateiname der mitgelieferten Liste, aus der diese Liste stammt. */
  sampleFile?: string;
}

export const DEFAULT_LANGUAGE_A = 'Sprache A';
export const DEFAULT_LANGUAGE_B = 'Sprache B';

/** Lernstand eines Wortes in genau einer Richtung. */
export interface ProgressRecord {
  listId: string;
  entryKey: string;
  direction: Direction;
  /** Anzahl der aufeinanderfolgenden korrekten Antworten. */
  streak: number;
  learned: boolean;
  updatedAt: number;
}

/** Bewertung einer Karte durch den Nutzer. */
export type Rating = 'known' | 'unknown';

/** Ob eine Übung einer Liste bereits einmal richtig gelöst wurde. */
export interface ExerciseProgressRecord {
  listId: string;
  exerciseKey: string;
  solved: boolean;
  updatedAt: number;
}

/** Anzahl korrekter Antworten in Folge, ab der ein Wort als gelernt gilt. */
export const LEARNED_THRESHOLD = 3;

/** Gibt das abgefragte Wort (Vorderseite) für die Richtung zurück. */
export function promptWord(entry: VocabEntry, direction: Direction): string {
  return direction === 'a-to-b' ? entry.wordA : entry.wordB;
}

/** Gibt das zu erratende Wort (Rückseite) für die Richtung zurück. */
export function answerWord(entry: VocabEntry, direction: Direction): string {
  return direction === 'a-to-b' ? entry.wordB : entry.wordA;
}

/** Gibt die Sprachbezeichnungen in Abfragereihenfolge zurück. */
export function directionLabels(
  list: Pick<VocabList, 'languageA' | 'languageB'>,
  direction: Direction,
): { from: string; to: string } {
  return direction === 'a-to-b'
    ? { from: list.languageA, to: list.languageB }
    : { from: list.languageB, to: list.languageA };
}
