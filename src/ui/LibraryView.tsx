import { useState } from 'react';
import { summarizeProgress } from '../domain/progress';
import { DIRECTIONS, directionLabels } from '../domain/types';
import type { Direction, ProgressRecord, VocabList } from '../domain/types';

interface LibraryViewProps {
  lists: VocabList[];
  progress: ReadonlyMap<string, ProgressRecord>;
  onStart: (listId: string, direction: Direction) => void;
  onImport: () => void;
  onReset: (listId: string) => void;
  onDelete: (listId: string) => void;
}

type PendingAction =
  | { kind: 'reset'; list: VocabList }
  | { kind: 'delete'; list: VocabList };

export function LibraryView({
  lists,
  progress,
  onStart,
  onImport,
  onReset,
  onDelete,
}: LibraryViewProps) {
  const [pending, setPending] = useState<PendingAction | undefined>(undefined);

  const confirm = (): void => {
    if (pending === undefined) {
      return;
    }
    if (pending.kind === 'reset') {
      onReset(pending.list.id);
    } else {
      onDelete(pending.list.id);
    }
    setPending(undefined);
  };

  return (
    <section className="screen">
      <header className="screen-header">
        <h1>Vokabeltrainer</h1>
        <button type="button" className="button" onClick={onImport}>
          Importieren
        </button>
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
            <h2>{list.name}</h2>
            <p className="muted">
              {list.entries.length} Wörter · {list.languageA} ↔ {list.languageB}
            </p>

            <div className="direction-grid">
              {DIRECTIONS.map((direction) => {
                const labels = directionLabels(list, direction);
                const summary = summarizeProgress(list.entries, progress, list.id, direction);
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
                    <span className="direction-stats">
                      {summary.learned} gelernt · {summary.open} offen
                      {done ? ' · abgeschlossen' : ''}
                    </span>
                    <progress value={summary.learned} max={summary.total} />
                  </button>
                );
              })}
            </div>

            <div className="button-row">
              <button
                type="button"
                className="link-button"
                onClick={() => setPending({ kind: 'reset', list })}
              >
                Fortschritt zurücksetzen
              </button>
              <button
                type="button"
                className="link-button link-button--danger"
                onClick={() => setPending({ kind: 'delete', list })}
              >
                Liste löschen
              </button>
            </div>
          </li>
        ))}
      </ul>

      {pending !== undefined ? (
        <div className="dialog-backdrop" role="dialog" aria-modal="true">
          <div className="dialog">
            <p>
              {pending.kind === 'reset'
                ? `Fortschritt von „${pending.list.name}“ in beiden Richtungen zurücksetzen?`
                : `Liste „${pending.list.name}“ und den zugehörigen Fortschritt löschen?`}
            </p>
            <div className="button-row">
              <button type="button" className="button" onClick={() => setPending(undefined)}>
                Abbrechen
              </button>
              <button type="button" className="button button--danger" onClick={confirm}>
                {pending.kind === 'reset' ? 'Zurücksetzen' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
