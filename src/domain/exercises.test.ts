import { describe, expect, it } from 'vitest';
import { deriveChoiceKey, deriveGapKey } from './entryKey';
import {
  applyExerciseResult,
  indexExerciseProgress,
  openExercises,
  summarizeExercises,
} from './exercises';
import { drawNext } from './session';
import type { Exercise, ExerciseProgressRecord, GapPart } from './types';

const LIST = 'liste-1';

const hablo: GapPart[] = [
  { kind: 'text', text: 'Yo ' },
  { kind: 'gap', text: 'hablo' },
  { kind: 'text', text: ' español.' },
];

function choice(index: number): Exercise {
  return {
    kind: 'choice',
    key: deriveChoiceKey(`Frage ${index}`, 'richtig'),
    question: `Frage ${index}`,
    options: ['richtig', 'falsch'],
    answerIndex: 0,
  };
}

function solved(exerciseKey: string): ExerciseProgressRecord {
  return { listId: LIST, exerciseKey, solved: true, updatedAt: 0 };
}

describe('Übungsschlüssel', () => {
  it('bleibt beim Lückentext unabhängig von Groß-/Kleinschreibung und Leerräumen gleich', () => {
    const variant: GapPart[] = [
      { kind: 'text', text: 'yo  ' },
      { kind: 'gap', text: 'HABLO' },
      { kind: 'text', text: ' español.' },
    ];

    expect(deriveGapKey(variant)).toBe(deriveGapKey(hablo));
  });

  it('ändert sich beim Lückentext mit dem Satz oder dem Lückenwort', () => {
    const otherWord: GapPart[] = [hablo[0]!, { kind: 'gap', text: 'escribo' }, hablo[2]!];
    const otherGap: GapPart[] = [{ kind: 'text', text: 'Yo hablo ' }, { kind: 'gap', text: 'español' }, { kind: 'text', text: '.' }];

    expect(deriveGapKey(otherWord)).not.toBe(deriveGapKey(hablo));
    expect(deriveGapKey(otherGap)).not.toBe(deriveGapKey(hablo));
  });

  it('hängt bei Auswahlfragen nur von Frage und richtiger Antwort ab', () => {
    const key = deriveChoiceKey('Nosotros ___ en Madrid.', 'vivimos');

    expect(deriveChoiceKey('Nosotros ___ en Madrid.', 'Vivimos')).toBe(key);
    expect(deriveChoiceKey('Nosotros ___ en Madrid.', 'viven')).not.toBe(key);
    expect(deriveChoiceKey('Ellos ___ en Madrid.', 'vivimos')).not.toBe(key);
  });

  it('unterscheidet Lückentext und Auswahlfrage mit gleichem Text', () => {
    expect(deriveGapKey(hablo)).not.toBe(deriveChoiceKey('Yo {hablo} español.', ''));
  });
});

describe('applyExerciseResult', () => {
  const context = { listId: LIST, exerciseKey: 'k', now: 1 };

  it('löst eine Übung nach einer richtigen Antwort', () => {
    expect(applyExerciseResult(undefined, true, context).solved).toBe(true);
  });

  it('markiert eine Übung bei falscher Antwort nie als gelöst', () => {
    expect(applyExerciseResult(undefined, false, context).solved).toBe(false);
    expect(
      applyExerciseResult({ ...solved('k'), solved: false }, false, context).solved,
    ).toBe(false);
  });
});

describe('Übungsübersicht', () => {
  const twelve = Array.from({ length: 12 }, (_, index) => choice(index));

  it('weist bei 12 Übungen mit 4 gelösten 4 gelöste und 8 offene aus', () => {
    const index = indexExerciseProgress(twelve.slice(0, 4).map((item) => solved(item.key)));

    expect(summarizeExercises(twelve, index, LIST)).toEqual({ solved: 4, open: 8, total: 12 });
  });

  it('lässt gelöste Übungen bei den offenen weg', () => {
    const index = indexExerciseProgress([solved(twelve[0]!.key)]);

    expect(openExercises(twelve, index, LIST).map((item) => item.key)).not.toContain(
      twelve[0]!.key,
    );
  });

  it('zählt Fortschritt anderer Listen nicht mit', () => {
    const index = indexExerciseProgress([{ ...solved(twelve[0]!.key), listId: 'andere' }]);

    expect(summarizeExercises(twelve, index, LIST).solved).toBe(0);
  });
});

describe('drawNext für Übungen', () => {
  const three = [choice(0), choice(1), choice(2)];

  it('zieht dieselbe Übung nicht direkt hintereinander', () => {
    for (const value of [0, 0.4, 0.999]) {
      expect(drawNext(three, three[0]!.key, () => value)?.key).not.toBe(three[0]!.key);
    }
  });
});
