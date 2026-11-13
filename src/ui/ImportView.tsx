import { useRef, useState } from 'react';
import type { ImportOutcome } from '../import/validate';
import { ImportError } from '../import/validate';
import type { ImportSummary } from '../app/useLibrary';
import type { VocabList } from '../domain/types';

interface ImportViewProps {
  lists: VocabList[];
  onReadFile: (file: File) => Promise<ImportOutcome>;
  onImport: (outcome: ImportOutcome, replaceListId?: string) => Promise<ImportSummary>;
  onDone: () => void;
}

interface Conflict {
  outcome: ImportOutcome;
  existing: VocabList;
}

export function ImportView({ lists, onReadFile, onImport, onDone }: ImportViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [summary, setSummary] = useState<ImportSummary | undefined>(undefined);
  const [conflict, setConflict] = useState<Conflict | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const handleFile = (file: File): void => {
    setError(undefined);
    setSummary(undefined);
    setConflict(undefined);
    setBusy(true);

    void (async () => {
      try {
        const outcome = await onReadFile(file);
        const existing = lists.find(
          (list) => list.name.toLocaleLowerCase('de') === outcome.list.name.toLocaleLowerCase('de'),
        );

        if (existing !== undefined) {
          setConflict({ outcome, existing });
          return;
        }
        setSummary(await onImport(outcome));
      } catch (cause) {
        setError(
          cause instanceof ImportError ? cause.message : 'Die Datei konnte nicht gelesen werden.',
        );
      } finally {
        setBusy(false);
      }
    })();
  };

  const resolveConflict = (replace: boolean): void => {
    if (conflict === undefined) {
      return;
    }
    const current = conflict;
    setConflict(undefined);
    setBusy(true);

    void (async () => {
      try {
        setSummary(
          await onImport(current.outcome, replace ? current.existing.id : undefined),
        );
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <section className="screen">
      <header className="screen-header">
        <button type="button" className="link-button" onClick={onDone}>
          ← Übersicht
        </button>
      </header>

      <h2>Liste importieren</h2>
      <p className="muted">
        JSON- oder CSV-Datei auswählen. Das erwartete Format steht in der README.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".json,.csv,application/json,text/csv"
        className="visually-hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file !== undefined) {
            handleFile(file);
          }
          event.target.value = '';
        }}
      />

      <button
        type="button"
        className="button button--primary"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        Datei auswählen
      </button>

      {error !== undefined ? (
        <p className="message message--error" role="alert">
          {error}
        </p>
      ) : null}

      {conflict !== undefined ? (
        <div className="message message--warn" role="alert">
          <p>
            Eine Liste mit dem Namen „{conflict.existing.name}“ existiert bereits. Was soll
            passieren?
          </p>
          <div className="button-row">
            <button type="button" className="button" onClick={() => resolveConflict(true)}>
              Ersetzen (Fortschritt bleibt erhalten)
            </button>
            <button type="button" className="button" onClick={() => resolveConflict(false)}>
              Zusätzlich anlegen
            </button>
          </div>
        </div>
      ) : null}

      {summary !== undefined ? (
        <div className="message message--ok" role="status">
          <p>
            {summary.imported} Einträge in „{summary.listName}“ importiert.
          </p>
          {summary.issues.length > 0 ? (
            <>
              <p>{summary.issues.length} Zeilen wurden übersprungen:</p>
              <ul className="issue-list">
                {summary.issues.slice(0, 20).map((issue) => (
                  <li key={issue.position}>
                    Position {issue.position}: {issue.reason}
                  </li>
                ))}
              </ul>
              {summary.issues.length > 20 ? (
                <p className="muted">… und {summary.issues.length - 20} weitere.</p>
              ) : null}
            </>
          ) : null}
          <button type="button" className="button button--primary" onClick={onDone}>
            Zur Übersicht
          </button>
        </div>
      ) : null}
    </section>
  );
}
