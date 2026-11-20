import { describe, expect, it } from 'vitest';
import { languageCode, languageCodes } from './languageCode';

describe('languageCode', () => {
  it.each([
    ['Spanisch', 'ESP'],
    ['Deutsch', 'DEU'],
    ['englisch', 'ENG'],
    [' Französisch ', 'FRA'],
    ['Sprache A', 'A'],
  ])('kürzt "%s" zu "%s"', (name, code) => {
    expect(languageCode(name)).toBe(code);
  });

  it('nimmt bei unbekannten Namen die ersten drei Buchstaben', () => {
    expect(languageCode('Esperanto')).toBe('ESP');
    expect(languageCode('Klingonisch')).toBe('KLI');
  });
});

describe('languageCodes', () => {
  it('liefert die Kürzel beider Sprachen', () => {
    expect(languageCodes('Spanisch', 'Deutsch')).toEqual({ a: 'ESP', b: 'DEU' });
  });

  it('behält die vollen Namen, wenn beide Kürzel gleich wären', () => {
    expect(languageCodes('Spanisch', 'Esperanto')).toEqual({ a: 'Spanisch', b: 'Esperanto' });
  });
});
