import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFromCsv } from './csv';
import { importFromJson } from './json';
import { ImportError, parseGapSentence, validateExercises, type RawExercise } from './validate';

function raw(position: number, fields: Partial<Omit<RawExercise, 'position'>>): RawExercise {
  return {
    position,
    type: undefined,
    sentence: undefined,
    question: undefined,
    options: undefined,
    answer: undefined,
    explanation: undefined,
    ...fields,
  };
}

const ENTRY = { wordA: 'hablar', wordB: 'sprechen' };

describe('parseGapSentence', () => {
  it('zerlegt einen Satz mit zwei Lücken in Text- und Lückenstücke', () => {
    expect(parseGapSentence('Yo {hablo} y tú {hablas}.')).toEqual([
      { kind: 'text', text: 'Yo ' },
      { kind: 'gap', text: 'hablo' },
      { kind: 'text', text: ' y tú ' },
      { kind: 'gap', text: 'hablas' },
      { kind: 'text', text: '.' },
    ]);
  });

  it('erlaubt eine Lücke am Satzanfang', () => {
    expect(parseGapSentence('{Hola}, Juan.')).toEqual([
      { kind: 'gap', text: 'Hola' },
      { kind: 'text', text: ', Juan.' },
    ]);
  });

  it.each([
    ['Yo hablo español.', 'Keine Lücke markiert'],
    ['Yo { } español.', 'Leere Lücke'],
    ['Yo {hablo español.', 'Lücke ist nicht geschlossen'],
    ['Yo hablo} español.', 'Schließende Klammer ohne öffnende'],
    ['Yo {ha{blo}} español.', 'Lücken dürfen nicht verschachtelt sein'],
  ])('lehnt "%s" ab', (sentence, reason) => {
    expect(parseGapSentence(sentence)).toBe(reason);
  });
});

describe('validateExercises', () => {
  it('übernimmt einen gültigen Lückentext und eine gültige Auswahlfrage', () => {
    const result = validateExercises([
      raw(1, { type: 'gap', sentence: 'Yo {hablo} español.', explanation: '1. Person' }),
      raw(2, {
        type: 'choice',
        question: 'Nosotros ___ en Madrid.',
        options: ['vivo', 'vivimos', 'viven'],
        answer: 'vivimos',
      }),
    ]);

    expect(result.issues).toEqual([]);
    expect(result.exercises).toHaveLength(2);
    expect(result.exercises[0]).toMatchObject({ kind: 'gap', explanation: '1. Person' });
    expect(result.exercises[1]).toMatchObject({ kind: 'choice', answerIndex: 1 });
    expect(result.exercises[1]).not.toHaveProperty('explanation');
  });

  it.each([
    [raw(1, { type: 'choice', question: 'F?', options: ['nur eine'], answer: 'nur eine' }), 'Weniger als zwei Antwortmöglichkeiten'],
    [raw(1, { type: 'choice', question: 'F?', options: ['a', 'b'], answer: 'c' }), 'Richtige Antwort ist keine der Antwortmöglichkeiten'],
    [raw(1, { type: 'choice', question: 'F?', options: ['a', 'A'], answer: 'a' }), 'Doppelte Antwortmöglichkeit'],
    [raw(1, { type: 'choice', question: '', options: ['a', 'b'], answer: 'a' }), 'Frage fehlt'],
    [raw(1, { type: 'gap', sentence: 'Ohne Lücke.' }), 'Keine Lücke markiert'],
    [raw(1, { type: 'quiz' }), 'Unbekannter Übungstyp "quiz"'],
    [raw(1, {}), 'Übungstyp fehlt'],
  ])('meldet fehlerhafte Übung %#', (exercise, reason) => {
    const result = validateExercises([exercise]);

    expect(result.exercises).toEqual([]);
    expect(result.issues).toEqual([{ position: 1, reason, scope: 'exercise' }]);
  });

  it('meldet die zweite gleiche Übung als Duplikat, auch bei anderer Erklärung', () => {
    const result = validateExercises([
      raw(1, { type: 'gap', sentence: 'Yo {hablo} español.', explanation: 'A' }),
      raw(2, { type: 'gap', sentence: 'yo {HABLO} español.', explanation: 'B' }),
    ]);

    expect(result.exercises).toHaveLength(1);
    expect(result.issues).toEqual([
      { position: 2, reason: 'Doppelte Übung, bereits an Position 1', scope: 'exercise' },
    ]);
  });
});

describe('importFromJson mit Übungen', () => {
  it('importiert alle Einträge und die gültigen Übungen und meldet die fehlerhaften', () => {
    const exercises = [
      ...Array.from({ length: 4 }, (_, index) => ({
        type: 'gap',
        sentence: `Satz ${index} mit {Lücke}.`,
      })),
      ...Array.from({ length: 4 }, (_, index) => ({
        type: 'choice',
        question: `Frage ${index}?`,
        options: ['ja', 'nein'],
        answer: 'ja',
      })),
      { type: 'gap', sentence: 'Kaputt' },
      { type: 'choice', question: 'Kaputt?', options: ['ja'], answer: 'ja' },
    ];

    const { list, issues } = importFromJson(
      JSON.stringify({ entries: [ENTRY, { wordA: 'vivir', wordB: 'leben' }], exercises }),
      'Test',
    );

    expect(list.entries).toHaveLength(2);
    expect(list.exercises).toHaveLength(8);
    expect(issues.map((issue) => [issue.scope, issue.position])).toEqual([
      ['exercise', 9],
      ['exercise', 10],
    ]);
  });

  it('liefert ohne Übungsblock eine leere Übungsliste', () => {
    const { list } = importFromJson(JSON.stringify({ entries: [ENTRY] }), 'Test');

    expect(list.exercises).toEqual([]);
  });

  it('lehnt einen Übungsblock ab, der keine Liste ist', () => {
    expect(() =>
      importFromJson(JSON.stringify({ entries: [ENTRY], exercises: {} }), 'Test'),
    ).toThrow(ImportError);
  });

  it('lehnt eine Datei ohne gültige Einträge weiterhin ab, auch mit Übungen', () => {
    const text = JSON.stringify({
      entries: [],
      exercises: [{ type: 'gap', sentence: 'Yo {hablo}.' }],
    });

    expect(() => importFromJson(text, 'Test')).toThrow(ImportError);
  });

  it('liefert beim CSV-Import keine Übungen', () => {
    const { list } = importFromCsv('Spanisch,Deutsch\nhablar,sprechen\n', 'Test');

    expect(list.exercises).toEqual([]);
  });
});

describe('Übungsformat in der README', () => {
  it('wird vom Importer ohne Meldungen gelesen', () => {
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    const section = readme.split('### Übungen')[1] ?? '';
    const example = /```json\r?\n([\s\S]*?)```/.exec(section)?.[1];

    expect(example).toBeDefined();
    const { list, issues } = importFromJson(example ?? '', 'README');

    expect(issues).toEqual([]);
    expect(list.exercises.map((exercise) => exercise.kind)).toEqual(['gap', 'choice']);
  });
});
