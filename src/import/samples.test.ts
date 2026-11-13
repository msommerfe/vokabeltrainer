import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFromJson } from './json';

const SAMPLES = [
  { file: 'spanisch-grundwortschatz.json', name: 'Spanisch Grundwortschatz' },
  { file: 'spanisch-alltagswoerter.json', name: 'Spanisch Alltagswörter' },
  { file: 'spanisch-aufbauwortschatz.json', name: 'Spanisch Aufbauwortschatz' },
];

function loadSample(file: string) {
  const text = readFileSync(join(process.cwd(), 'public', 'samples', file), 'utf8');
  return importFromJson(text, 'Beispiel');
}

/** Konjugationsbeispiele sind an den sechs mit " · " getrennten Formen erkennbar. */
function isConjugation(sentence: string): boolean {
  return sentence.split(' · ').length === 6;
}

describe.each(SAMPLES)('mitgelieferte Liste $name', ({ file, name }) => {
  it('enthält genau 100 fehlerfreie Einträge', () => {
    const { list, issues } = loadSample(file);

    expect(issues).toEqual([]);
    expect(list.entries).toHaveLength(100);
  });

  it('ist als Spanisch–Deutsch benannt', () => {
    const { list } = loadSample(file);

    expect(list.name).toBe(name);
    expect(list.languageA).toBe('Spanisch');
    expect(list.languageB).toBe('Deutsch');
  });

  it('gibt jedem Eintrag mindestens ein Beispiel', () => {
    const { list } = loadSample(file);
    const withoutExample = list.entries.filter((entry) => entry.examples.length === 0);

    expect(withoutExample.map((entry) => entry.wordA)).toEqual([]);
  });

  it('enthält keine doppelten Wortpaare', () => {
    const { list } = loadSample(file);

    expect(new Set(list.entries.map((entry) => entry.key)).size).toBe(list.entries.length);
  });

  it('zeigt bei Verben die sechs Präsensformen in beiden Sprachen', () => {
    const { list } = loadSample(file);
    const verbs = list.entries.filter((entry) =>
      entry.examples.some((example) => isConjugation(example.sentenceA)),
    );

    expect(verbs.length).toBeGreaterThan(0);
    for (const entry of verbs) {
      const conjugation = entry.examples.find((example) => isConjugation(example.sentenceA));
      expect(conjugation?.sentenceB.split(' · ')).toHaveLength(6);
      // Neben der Konjugation steht immer ein einfacher Beispielsatz.
      expect(entry.examples.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('Startdatensatz insgesamt', () => {
  it('liefert drei Listen mit zusammen 300 Einträgen', () => {
    const total = SAMPLES.reduce(
      (sum, sample) => sum + loadSample(sample.file).list.entries.length,
      0,
    );

    expect(SAMPLES).toHaveLength(3);
    expect(total).toBe(300);
  });

  it('wiederholt kein Wortpaar über die Listen hinweg', () => {
    const keys = SAMPLES.flatMap((sample) =>
      loadSample(sample.file).list.entries.map((entry) => entry.key),
    );
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);

    expect(duplicates).toEqual([]);
  });
});
