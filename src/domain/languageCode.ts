const KNOWN_CODES: Record<string, string> = {
  arabisch: 'ARA',
  chinesisch: 'CHN',
  dänisch: 'DAN',
  deutsch: 'DEU',
  englisch: 'ENG',
  finnisch: 'FIN',
  französisch: 'FRA',
  griechisch: 'GRE',
  italienisch: 'ITA',
  japanisch: 'JPN',
  koreanisch: 'KOR',
  kroatisch: 'HRV',
  latein: 'LAT',
  niederländisch: 'NLD',
  norwegisch: 'NOR',
  polnisch: 'POL',
  portugiesisch: 'POR',
  rumänisch: 'RUM',
  russisch: 'RUS',
  schwedisch: 'SWE',
  spanisch: 'ESP',
  tschechisch: 'CZE',
  türkisch: 'TUR',
  ukrainisch: 'UKR',
  ungarisch: 'HUN',
  'sprache a': 'A',
  'sprache b': 'B',
};

/** Kurzform eines Sprachnamens, z. B. "Spanisch" → "ESP"; unbekannte Namen → erste drei Buchstaben. */
export function languageCode(name: string): string {
  const normalized = name.trim().toLocaleLowerCase('de');
  return KNOWN_CODES[normalized] ?? normalized.slice(0, 3).toLocaleUpperCase('de');
}

/** Kurzformen beider Sprachen; fallen sie zusammen, bleiben die vollen Namen eindeutig. */
export function languageCodes(languageA: string, languageB: string): { a: string; b: string } {
  const a = languageCode(languageA);
  const b = languageCode(languageB);
  return a === b ? { a: languageA, b: languageB } : { a, b };
}
