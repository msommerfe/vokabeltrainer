import { useState } from 'react';
import { summarizeExercises, type ExerciseProgressIndex } from '../domain/exercises';
import { summarizeProgress } from '../domain/progress';
import type { Settings } from '../domain/settings';
import { DIRECTIONS, directionLabels } from '../domain/types';
import type { Direction, ProgressRecord, VocabList } from '../domain/types';

interface LibraryViewProps {
  lists: VocabList[];
  progress: ReadonlyMap<string, ProgressRecord>;
  exerciseProgress: ExerciseProgressIndex;
  settings: Settings;
  onStart: (listId: string, direction: Direction) => void;
  onStartExercises: (listId: string) => void;
  onShowOverview: (listId: string) => void;
  onOpenSettings: () => void;
  onImport: () => void;
  onReset: (listId: string) => void;
  onResetExercises: (listId: string) => void;
  onDelete: (listId: string) => void;
}

type PendingAction =
  | { kind: 'reset'; list: VocabList }
  | { kind: 'reset-exercises'; list: VocabList }
  | { kind: 'delete'; list: VocabList };

const CONFIRM_TEXT: Record<PendingAction['kind'], { question: (name: string) => string; action: string }> = {
  reset: {
    question: (name) => `Vokabelfortschritt von „${name}“ in beiden Richtungen zurücksetzen?`,
    action: 'Zurücksetzen',
  },
  'reset-exercises': {
    question: (name) => `Übungsfortschritt von „${name}“ zurücksetzen?`,
    action: 'Zurücksetzen',
  },
  delete: {
    question: (name) => `Liste „${name}“ und den zugehörigen Fortschritt löschen?`,
    action: 'Löschen',
  },
};

export function LibraryView({
  lists,
  progress,
  exerciseProgress,
  settings,
  onStart,
  onStartExercises,
  onShowOverview,
  onOpenSettings,
  onImport,
  onReset,
  onResetExercises,
  onDelete,
}: LibraryViewProps) {
  const [pending, setPending] = useState<PendingAction | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | undefined>(undefined);

  const confirm = (): void => {
    if (pending === undefined) {
      return;
    }
    if (pending.kind === 'reset') {
      onReset(pending.list.id);
    } else if (pending.kind === 'reset-exercises') {
      onResetExercises(pending.list.id);
    } else {
      onDelete(pending.list.id);
    }
    setPending(undefined);
  };

  return (
    <section className="screen">
      <header className="screen-header">
        <h1>Vokabeltrainer</h1>
        <div className="header-actions">
          <button
            type="button"
            className="button button--icon"
            aria-label="Einstellungen"
            title="Einstellungen"
            onClick={onOpenSettings}
          >
            ⚙
          </button>
          <button type="button" className="button" onClick={onImport}>
            Importieren
          </button>
        </div>
      </header>

      {lists.length === 0 ? (
        <div className="empty-state">
          <h2>Noch keine Liste</h2>
          <p>Importiere eine JSON- oder CSV-Datei, um loszulegen.</p>
        </div>
      ) : null}

      <ul className="list-grid">
        {lists.map((list) => (
          <li key={list.id} className="list-card">
            <div className="list-card-head">
              <h2 title={list.name}>{list.name}</h2>
              <span className="list-card-meta">{list.entries.length} Wörter</span>
              <button
                type="button"
                className="button button--icon list-card-more"
                aria-expanded={expandedId === list.id}
                aria-label={`Weitere Aktionen für ${list.name}`}
                onClick={() => {
                  setExpandedId((current) => (current === list.id ? undefined : list.id));
                }}
              >
                ⋯
              </button>
            </div>

            <div className="direction-grid">
              {DIRECTIONS.map((direction) => {
                const labels = directionLabels(list, direction);
                const summary = summarizeProgress(
                  list.entries,
                  progress,
                  list.id,
                  direction,
                  settings.vocab.threshold,
                );
                const done = summary.total > 0 && summary.open === 0;

                return (
                  <button
                    key={direction}
                    type="button"
                    className="direction-button"
                    onClick={() => onStart(list.id, direction)}
                  >
                    <span className="direction-label">
                      {labels.from} → {labels.to}
                    </span>
                    <span className={`direction-stats${done ? ' direction-stats--done' : ''}`}>
                      <span aria-hidden="true">
                        {summary.learned} ✓ · {summary.open} offen
                      </span>
                      <span className="visually-hidden">
                        {summary.learned} gelernt · {summary.open} offen
                      </span>
                    </span>
                    <progress value={summary.learned} max={summary.total} />
                  </button>
                );
              })}

              {list.exercises.length > 0 ? (
                <ExerciseTile
                  list={list}
                  exerciseProgress={exerciseProgress}
                  threshold={settings.exercises.threshold}
                  onStart={() => onStartExercises(list.id)}
                />
              ) : null}
            </div>

            {expandedId === list.id ? (
            <div className="list-card-actions">
              <button
                type="button"
                className="link-button"
                onClick={() => onShowOverview(list.id)}
              >
                Alle Vokabeln
              </button>
              <button
                type="button"
                className="link-button"
                onClick={() => setPending({ kind: 'reset', list })}
              >
                Vokabeln zurücksetzen
              </button>
              {list.exercises.length > 0 ? (
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setPending({ kind: 'reset-exercises', list })}
                >
                  Übungen zurücksetzen
                </button>
              ) : null}
              <button
                type="button"
                className="link-button link-button--danger"
                onClick={() => setPending({ kind: 'delete', list })}
              >
                Liste löschen
              </button>
            </div>
            ) : null}
          </li>
        ))}
      </ul>

      {pending !== undefined ? (
        <div className="dialog-backdrop" role="dialog" aria-modal="true">
          <div className="dialog">
            <p>{CONFIRM_TEXT[pending.kind].question(pending.list.name)}</p>
            <div className="button-row">
              <button type="button" className="button" onClick={() => setPending(undefined)}>
                Abbrechen
              </button>
              <button type="button" className="button button--danger" onClick={confirm}>
                {CONFIRM_TEXT[pending.kind].action}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ExerciseTile({
  list,
  exerciseProgress,
  threshold,
  onStart,
}: {
  list: VocabList;
  exerciseProgress: ExerciseProgressIndex;
  threshold: number;
  onStart: () => void;
}) {
  const summary = summarizeExercises(list.exercises, exerciseProgress, list.id, threshold);
  const done = summary.open === 0;

  return (
    <button type="button" className="direction-button" onClick={onStart}>
      <span className="direction-label">Übungen</span>
      <span className={`direction-stats${done ? ' direction-stats--done' : ''}`}>
        <span aria-hidden="true">
          {summary.solved} ✓ · {summary.open} offen
        </span>
        <span className="visually-hidden">
          {summary.solved} gelöst · {summary.open} offen
        </span>
      </span>
      <progress value={summary.solved} max={summary.total} />
    </button>
  );
}
