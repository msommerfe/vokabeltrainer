import type { SessionTally } from '../domain/session';

interface SummaryViewProps {
  tally: SessionTally;
  onBack: () => void;
  onAgain: () => void;
}

export function SummaryView({ tally, onBack, onAgain }: SummaryViewProps) {
  return (
    <section className="screen">
      <h2>Sitzung beendet</h2>

      <dl className="tally">
        <div>
          <dt>Gewusst</dt>
          <dd className="tally-good">{tally.known}</dd>
        </div>
        <div>
          <dt>Nicht gewusst</dt>
          <dd className="tally-bad">{tally.unknown}</dd>
        </div>
        <div>
          <dt>Neu gelernt</dt>
          <dd>{tally.newlyLearned.length}</dd>
        </div>
      </dl>

      {tally.newlyLearned.length > 0 ? (
        <>
          <p className="muted">Diese Wörter gelten jetzt als gelernt:</p>
          <ul className="learned-list">
            {tally.newlyLearned.map((word) => (
              <li key={word}>{word}</li>
            ))}
          </ul>
        </>
      ) : null}

      <div className="button-row">
        <button type="button" className="button" onClick={onBack}>
          Zur Übersicht
        </button>
        <button type="button" className="button button--primary" onClick={onAgain}>
          Weiter üben
        </button>
      </div>
    </section>
  );
}
