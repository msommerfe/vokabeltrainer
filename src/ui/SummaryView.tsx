import type { SessionTally } from '../domain/session';

export interface SummaryLabels {
  known: string;
  unknown: string;
  learned: string;
  learnedIntro: string;
}

export const VOCAB_SUMMARY: SummaryLabels = {
  known: 'Gewusst',
  unknown: 'Nicht gewusst',
  learned: 'Neu gelernt',
  learnedIntro: 'Diese Wörter gelten jetzt als gelernt:',
};

export const EXERCISE_SUMMARY: SummaryLabels = {
  known: 'Richtig',
  unknown: 'Falsch',
  learned: 'Neu gelöst',
  learnedIntro: 'Diese Übungen gelten jetzt als gelöst:',
};

interface SummaryViewProps {
  tally: SessionTally;
  labels?: SummaryLabels;
  onBack: () => void;
  onAgain: () => void;
}

export function SummaryView({ tally, labels = VOCAB_SUMMARY, onBack, onAgain }: SummaryViewProps) {
  return (
    <section className="screen">
      <h2>Sitzung beendet</h2>

      <dl className="tally">
        <div>
          <dt>{labels.known}</dt>
          <dd className="tally-good">{tally.known}</dd>
        </div>
        <div>
          <dt>{labels.unknown}</dt>
          <dd className="tally-bad">{tally.unknown}</dd>
        </div>
        <div>
          <dt>{labels.learned}</dt>
          <dd>{tally.newlyLearned.length}</dd>
        </div>
      </dl>

      {tally.newlyLearned.length > 0 ? (
        <>
          <p className="muted">{labels.learnedIntro}</p>
          <ul className="learned-list">
            {tally.newlyLearned.map((word, index) => (
              <li key={index}>{word}</li>
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
