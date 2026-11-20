import { useId, useState } from 'react';
import {
  isValidSessionSize,
  isValidThreshold,
  MAX_THRESHOLD,
  MIN_THRESHOLD,
  type Settings,
  type StudySettings,
} from '../domain/settings';

interface SettingsViewProps {
  settings: Settings;
  onChange: (next: Settings) => void;
  onDone: () => void;
}

export function SettingsView({ settings, onChange, onDone }: SettingsViewProps) {
  const update = (area: keyof Settings, patch: Partial<StudySettings>): void => {
    onChange({ ...settings, [area]: { ...settings[area], ...patch } });
  };

  return (
    <section className="screen">
      <header className="screen-header">
        <button type="button" className="link-button" onClick={onDone}>
          ← Übersicht
        </button>
      </header>

      <h2>Einstellungen</h2>

      <SettingsGroup
        title="Vokabeln"
        sizeLabel="Wörter pro Sitzung"
        thresholdLabel="Richtig in Folge bis gelernt"
        value={settings.vocab}
        onChange={(patch) => {
          update('vocab', patch);
        }}
      />
      <SettingsGroup
        title="Übungen"
        sizeLabel="Übungen pro Sitzung"
        thresholdLabel="Richtig in Folge bis gelöst"
        value={settings.exercises}
        onChange={(patch) => {
          update('exercises', patch);
        }}
      />

      <div className="settings-group">
        <h3 className="settings-title">Vorlage für eigene Listen</h3>
        <p className="settings-hint">
          Beispiel im Importformat mit 10 Einträgen, einem Lückentext und einer Auswahlfrage.
        </p>
        <a
          className="button"
          href={`${import.meta.env.BASE_URL}samples/${EXAMPLE_FILE}`}
          download={EXAMPLE_FILE}
        >
          Beispiel-JSON herunterladen
        </a>
      </div>
    </section>
  );
}

export const EXAMPLE_FILE = 'beispiel-vokabelliste.json';

function SettingsGroup({
  title,
  sizeLabel,
  thresholdLabel,
  value,
  onChange,
}: {
  title: string;
  sizeLabel: string;
  thresholdLabel: string;
  value: StudySettings;
  onChange: (patch: Partial<StudySettings>) => void;
}) {
  return (
    <fieldset className="settings-group">
      <legend>{title}</legend>
      <NumberField
        label={sizeLabel}
        hint="Leer lassen für alle"
        placeholder="alle"
        value={value.sessionSize}
        min={1}
        isValid={isValidSessionSize}
        onCommit={(sessionSize) => {
          onChange({ sessionSize });
        }}
      />
      <NumberField
        label={thresholdLabel}
        hint={`${String(MIN_THRESHOLD)} bis ${String(MAX_THRESHOLD)}`}
        value={value.threshold}
        min={MIN_THRESHOLD}
        max={MAX_THRESHOLD}
        isValid={(candidate) => isValidThreshold(candidate)}
        onCommit={(threshold) => {
          if (threshold !== null) {
            onChange({ threshold });
          }
        }}
      />
    </fieldset>
  );
}

/** Zahlenfeld, das erst beim Verlassen übernimmt und ungültige Eingaben verwirft. */
function NumberField({
  label,
  hint,
  placeholder,
  value,
  min,
  max,
  isValid,
  onCommit,
}: {
  label: string;
  hint: string;
  placeholder?: string;
  value: number | null;
  min: number;
  max?: number;
  isValid: (candidate: number | null) => boolean;
  onCommit: (next: number | null) => void;
}) {
  const id = useId();
  const shown = value === null ? '' : String(value);
  const [draft, setDraft] = useState(shown);

  const commit = (): void => {
    const text = draft.trim();
    const candidate = text === '' ? null : Number(text);
    if (isValid(candidate)) {
      setDraft(candidate === null ? '' : String(candidate));
      onCommit(candidate);
    } else {
      setDraft(shown);
    }
  };

  return (
    <div className="settings-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
      />
      <span className="settings-hint">{hint}</span>
    </div>
  );
}
