/** Einstellungen für einen Lernbereich (Vokabeln oder Übungen). */
export interface StudySettings {
  /** Anzahl verschiedener Elemente pro Sitzung; `null` bedeutet alle. */
  sessionSize: number | null;
  /** Richtige Antworten in Folge, bis ein Element als gelernt gilt. */
  threshold: number;
}

export interface Settings {
  vocab: StudySettings;
  exercises: StudySettings;
}

export const MIN_THRESHOLD = 1;
export const MAX_THRESHOLD = 10;

export const DEFAULT_SETTINGS: Settings = {
  vocab: { sessionSize: null, threshold: 3 },
  exercises: { sessionSize: null, threshold: 1 },
};

export function isValidThreshold(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_THRESHOLD &&
    value <= MAX_THRESHOLD
  );
}

export function isValidSessionSize(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isInteger(value) && value >= 1);
}

function parseStudy(raw: unknown, fallback: StudySettings): StudySettings {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const sessionSize = record['sessionSize'];
  const threshold = record['threshold'];
  return {
    sessionSize: isValidSessionSize(sessionSize) ? sessionSize : fallback.sessionSize,
    threshold: isValidThreshold(threshold) ? threshold : fallback.threshold,
  };
}

/** Liest gespeicherte Einstellungen; Fehlendes oder Ungültiges fällt auf Standardwerte. */
export function parseSettings(raw: unknown): Settings {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    vocab: parseStudy(record['vocab'], DEFAULT_SETTINGS.vocab),
    exercises: parseStudy(record['exercises'], DEFAULT_SETTINGS.exercises),
  };
}
