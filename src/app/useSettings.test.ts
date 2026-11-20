import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { loadSettings, saveSettings } from './useSettings';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe('Speicherung der Einstellungen', () => {
  it('liefert eine geänderte Sitzungsgröße nach erneutem Einlesen', () => {
    const storage = memoryStorage();
    const changed = { ...DEFAULT_SETTINGS, vocab: { sessionSize: 20, threshold: 3 } };

    saveSettings(changed, storage);

    expect(loadSettings(storage)).toEqual(changed);
  });

  it('liefert ohne gespeicherte Werte die Standardwerte', () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS);
  });

  it('liefert bei beschädigtem Inhalt die Standardwerte', () => {
    const storage = memoryStorage();
    storage.setItem('vokabeltrainer.settings', '{kaputt');

    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it('wirft nicht, wenn der Speicher Fehler meldet', () => {
    const failing = {
      getItem: () => {
        throw new Error('gesperrt');
      },
      setItem: () => {
        throw new Error('voll');
      },
    };

    expect(loadSettings(failing)).toEqual(DEFAULT_SETTINGS);
    expect(() => {
      saveSettings(DEFAULT_SETTINGS, failing);
    }).not.toThrow();
  });
});
