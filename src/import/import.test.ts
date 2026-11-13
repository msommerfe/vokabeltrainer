import { describe, expect, it } from 'vitest';
import { importFromJson } from './json';
import { importFromCsv } from './csv';
import { ImportError, validateEntries } from './validate';

describe('validateEntries', () => {
  it('lehnt einen Eintrag ohne Wort A ab', () => {
    const result = validateEntries([
      { position: 1, wordA: '', wordB: 'house', examples: [] },
      { position: 2, wordA: 'Hund', wordB: 'dog', examples: [] },
    ]);

    expect(result.entries).toHaveLength(1);
    expect(result.issues).toEqual([{ position: 1, reason: 'Wort in Sprache A fehlt' }]);
  });

  it('lehnt einen Eintrag ohne Wort B ab', () => {
    const result = validateEntries([
      { position: 1, wordA: 'Haus', wordB: '   ', examples: [] },
    ]);

    expect(result.entries).toHaveLength(0);
    expect(result.issues).toEqual([{ position: 1, reason: 'Wort in Sprache B fehlt' }]);
  });

  it('übernimmt einen Eintrag ohne Beispiele', () => {
    const result = validateEntries([{ position: 1, wordA: 'Haus', wordB: 'house', examples: [] }]);

    expect(result.issues).toHaveLength(0);
    expect(result.entries[0]?.examples).toEqual([]);
  });

  it('meldet den zweiten Eintrag mit gleichem Schlüssel als Duplikat', () => {
    const result = validateEntries([
      { position: 1, wordA: 'Haus', wordB: 'house', examples: [] },
      { position: 2, wordA: 'haus', wordB: 'HOUSE', examples: [] },
    ]);

    expect(result.entries).toHaveLength(1);
    expect(result.issues).toEqual([
      { position: 2, reason: 'Doppelter Eintrag, bereits an Position 1' },
    ]);
  });

  it('verwirft halbe Beispielpaare', () => {
    const result = validateEntries([
      {
        position: 1,
        wordA: 'Haus',
        wordB: 'house',
        examples: [
          { sentenceA: 'Das Haus ist groß.', sentenceB: 'The house is big.' },
          { sentenceA: 'Ohne Gegenstück', sentenceB: '' },
        ],
      },
    ]);

    expect(result.entries[0]?.examples).toEqual([
      { sentenceA: 'Das Haus ist groß.', sentenceB: 'The house is big.' },
    ]);
  });
});

describe('importFromJson', () => {
  it('importiert alle Einträge einer gültigen Datei', () => {
    const entries = Array.from({ length: 20 }, (_, index) => ({
      wordA: `Wort${index}`,
      wordB: `word${index}`,
    }));
    const text = JSON.stringify({ name: 'Testliste', languageA: 'Deutsch', languageB: 'Englisch', entries });

    const { list, issues } = importFromJson(text, 'fallback');

    expect(list.entries).toHaveLength(20);
    expect(list.name).toBe('Testliste');
    expect(list.languageA).toBe('Deutsch');
    expect(issues).toHaveLength(0);
  });

  it('übernimmt mehrere Beispiele je Eintrag', () => {
    const text = JSON.stringify({
      entries: [
        {
          wordA: 'Haus',
          wordB: 'house',
          examples: [
            { sentenceA: 'Das Haus ist groß.', sentenceB: 'The house is big.' },
            { sentenceA: 'Ein rotes Haus.', sentenceB: 'A red house.' },
          ],
        },
      ],
    });

    const { list } = importFromJson(text, 'fallback');

    expect(list.entries[0]?.examples).toHaveLength(2);
  });

  it('lehnt syntaktisch ungültiges JSON vollständig ab', () => {
    expect(() => importFromJson('{ das ist kein json', 'fallback')).toThrow(ImportError);
  });

  it('lehnt JSON ohne Eintragsliste ab', () => {
    expect(() => importFromJson('{"name":"x"}', 'fallback')).toThrow(ImportError);
  });

  it('fällt ohne Sprachbezeichnungen auf neutrale Namen zurück', () => {
    const text = JSON.stringify({ entries: [{ wordA: 'Haus', wordB: 'house' }] });

    const { list } = importFromJson(text, 'Meine Liste');

    expect(list.languageA).toBe('Sprache A');
    expect(list.languageB).toBe('Sprache B');
    expect(list.name).toBe('Meine Liste');
  });

  it('lehnt eine Datei ohne gültigen Eintrag ab', () => {
    const text = JSON.stringify({ entries: [{ wordA: '', wordB: '' }] });

    expect(() => importFromJson(text, 'fallback')).toThrow(ImportError);
  });
});

describe('importFromCsv', () => {
  it('importiert eine Datei mit Kopfzeile und 50 Datenzeilen', () => {
    const rows = Array.from({ length: 50 }, (_, index) => `Wort${index},word${index}`);
    const text = ['Deutsch,Englisch', ...rows].join('\n');

    const { list, issues } = importFromCsv(text, 'fallback');

    expect(list.entries).toHaveLength(50);
    expect(issues).toHaveLength(0);
  });

  it('liest Felder mit Kommas in Anführungszeichen korrekt', () => {
    const text = [
      'wort_a,wort_b,beispiel_a_1,beispiel_b_1',
      '"Haus, Heim",house,"Das Haus, es ist groß.","The house, it is big."',
    ].join('\n');

    const { list } = importFromCsv(text, 'fallback');

    expect(list.entries[0]?.wordA).toBe('Haus, Heim');
    expect(list.entries[0]?.examples[0]).toEqual({
      sentenceA: 'Das Haus, es ist groß.',
      sentenceB: 'The house, it is big.',
    });
  });

  it('importiert 47 von 50 Zeilen und meldet die 3 übersprungenen Zeilennummern', () => {
    const rows = Array.from({ length: 50 }, (_, index) => {
      const lineNumber = index + 2;
      if (lineNumber === 5 || lineNumber === 17 || lineNumber === 40) {
        return `Wort${index},`;
      }
      return `Wort${index},word${index}`;
    });
    const text = ['wort_a,wort_b', ...rows].join('\n');

    const { list, issues } = importFromCsv(text, 'fallback');

    expect(list.entries).toHaveLength(47);
    expect(issues.map((issue) => issue.position)).toEqual([5, 17, 40]);
  });

  it('lehnt eine Datei ohne gültige Zeile ab', () => {
    const text = ['wort_a,wort_b', ',', ','].join('\n');

    expect(() => importFromCsv(text, 'fallback')).toThrow(ImportError);
  });

  it('lehnt eine Datei ohne ausreichende Kopfzeile ab', () => {
    expect(() => importFromCsv('nur_eine_spalte\nHaus', 'fallback')).toThrow(ImportError);
  });

  it('nutzt aussagekräftige Spaltenüberschriften als Sprachbezeichnung', () => {
    const text = ['Deutsch,Englisch', 'Haus,house'].join('\n');

    const { list } = importFromCsv(text, 'fallback');

    expect(list.languageA).toBe('Deutsch');
    expect(list.languageB).toBe('Englisch');
  });

  it('fällt bei generischen Spaltennamen auf neutrale Sprachbezeichnungen zurück', () => {
    const text = ['wort_a,wort_b', 'Haus,house'].join('\n');

    const { list } = importFromCsv(text, 'fallback');

    expect(list.languageA).toBe('Sprache A');
    expect(list.languageB).toBe('Sprache B');
  });

  it('entfernt ein BOM am Dateianfang', () => {
    const text = ['\uFEFFwort_a,wort_b', 'Haus,house'].join('\n');

    const { list } = importFromCsv(text, 'fallback');

    expect(list.entries).toHaveLength(1);
    expect(list.entries[0]?.wordA).toBe('Haus');
  });

  it('meldet ein Duplikat mit seiner Zeilennummer', () => {
    const text = ['wort_a,wort_b', 'Haus,house', 'Hund,dog', 'haus,HOUSE'].join('\n');

    const { list, issues } = importFromCsv(text, 'fallback');

    expect(list.entries).toHaveLength(2);
    expect(issues).toEqual([{ position: 4, reason: 'Doppelter Eintrag, bereits an Position 2' }]);
  });
});
