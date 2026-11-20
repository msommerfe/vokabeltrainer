import { useCallback, useState } from 'react';
import { DEFAULT_SETTINGS, parseSettings, type Settings } from '../domain/settings';

const SETTINGS_KEY = 'vokabeltrainer.settings';

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

function defaultStorage(): KeyValueStorage | undefined {
  try {
    return localStorage;
  } catch {
    return undefined;
  }
}

/** Liest die Einstellungen; ohne Speicher oder bei beschädigten Daten gelten die Standardwerte. */
export function loadSettings(storage: KeyValueStorage | undefined = defaultStorage()): Settings {
  try {
    const stored = storage?.getItem(SETTINGS_KEY);
    return stored == null ? DEFAULT_SETTINGS : parseSettings(JSON.parse(stored));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(
  settings: Settings,
  storage: KeyValueStorage | undefined = defaultStorage(),
): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ohne Speicher gelten die Einstellungen bis zum Schließen der App.
  }
}

export function useSettings(): [Settings, (next: Settings) => void] {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  const update = useCallback((next: Settings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  return [settings, update];
}
