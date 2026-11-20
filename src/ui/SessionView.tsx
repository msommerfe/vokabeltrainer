import { useMemo, useRef, useState } from 'react';
import type { StudySettings } from '../domain/settings';
import {
  drawNext,
  emptyTally,
  openEntries,
  pickSession,
  type SessionTally,
} from '../domain/session';
import { directionLabels, type Direction, type VocabEntry, type VocabList } from '../domain/types';
import type { ProgressRecord, Rating } from '../domain/types';
import { Card, ReviewCard } from './Card';

interface SessionViewProps {
  list: VocabList;
  direction: Direction;
  progress: ReadonlyMap<string, ProgressRecord>;
  settings: StudySettings;
  onRate: (entryKey: string, rating: Rating) => Promise<{ newlyLearned: boolean }>;
  onFinish: (tally: SessionTally) => void;
  onLeave: () => void;
  onReset: () => void;
}

interface Rated {
  entry: VocabEntry;
  rating: Rating;
}

export function SessionView({
  list,
  direction,
  progress,
  settings,
  onRate,
  onFinish,
  onLeave,
  onReset,
}: SessionViewProps) {
  // Die Wörter der Sitzung werden beim Betreten festgelegt; während der Sitzung
  // fallen nur die hier neu gelernten heraus.
  const progressAtStart = useRef(progress);
  const settingsAtStart = useRef(settings);
  const initialOpen = useMemo(
    () =>
      pickSession(
        openEntries(
          list.entries,
          progressAtStart.current,
          list.id,
          direction,
          settingsAtStart.current.threshold,
        ),
        settingsAtStart.current.sessionSize,
      ),
    [list.entries, list.id, direction],
  );

  const [current, setCurrent] = useState(() => drawNext(initialOpen));
  const [draws, setDraws] = useState(0);
  const [learnedKeys, setLearnedKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [tally, setTally] = useState<SessionTally>(emptyTally);
  const [history, setHistory] = useState<readonly Rated[]>([]);
  // Index der angezeigten Verlaufskarte; `null` zeigt die aktuelle Karte.
  const [reviewing, setReviewing] = useState<number | null>(null);
  const labels = directionLabels(list, direction);

  if (initialOpen.length === 0) {
    return (
      <section className="screen">
        <header className="screen-header">
          <button type="button" className="link-button" onClick={onLeave}>
            ← Übersicht
          </button>
        </header>
        <div className="empty-state">
          <h2>Alles gelernt</h2>
          <p>
            In der Richtung {labels.from} → {labels.to} gilt jedes Wort dieser Liste als gelernt.
          </p>
          <button type="button" className="button button--primary" onClick={onReset}>
            Fortschritt dieser Liste zurücksetzen
          </button>
        </div>
      </section>
    );
  }

  const entry = current;
  if (entry === undefined) {
    return null;
  }

  const remaining = initialOpen.length - learnedKeys.size;
  const reviewed = reviewing === null ? undefined : history[reviewing];

  const handleRate = (rating: Rating): void => {
    void (async () => {
      const { newlyLearned } = await onRate(entry.key, rating);

      const nextTally: SessionTally = {
        known: tally.known + (rating === 'known' ? 1 : 0),
        unknown: tally.unknown + (rating === 'unknown' ? 1 : 0),
        newlyLearned: newlyLearned ? [...tally.newlyLearned, entry.wordA] : tally.newlyLearned,
      };
      setTally(nextTally);
      setHistory((previous) => [...previous, { entry, rating }]);

      const nextLearned = newlyLearned ? new Set(learnedKeys).add(entry.key) : learnedKeys;
      setLearnedKeys(nextLearned);

      const next = drawNext(
        initialOpen.filter((item) => !nextLearned.has(item.key)),
        entry.key,
      );
      if (next === undefined) {
        onFinish(nextTally);
      } else {
        setCurrent(next);
        setDraws((count) => count + 1);
      }
    })();
  };

  const back = (): void => {
    setReviewing((index) => (index === null ? history.length - 1 : Math.max(0, index - 1)));
  };

  const forward = (): void => {
    setReviewing((index) => (index === null || index + 1 >= history.length ? null : index + 1));
  };

  return (
    <section className="screen">
      <header className="screen-header">
        <button
          type="button"
          className="link-button"
          onClick={() => {
            onFinish(tally);
          }}
        >
          Beenden
        </button>
        <span className="screen-progress">{remaining} offen</span>
      </header>

      <progress
        className="session-bar"
        value={initialOpen.length - remaining}
        max={initialOpen.length}
      />

      {reviewed !== undefined ? (
        <ReviewCard
          entry={reviewed.entry}
          direction={direction}
          labels={labels}
          rating={reviewed.rating}
        />
      ) : (
        // Neuer Key je Ziehung, damit auch ein wiederholtes Wort verdeckt startet.
        <Card
          key={draws}
          entry={entry}
          direction={direction}
          labels={labels}
          onRate={handleRate}
        />
      )}

      {history.length > 0 ? (
        <nav className="review-nav" aria-label="Bewertete Karten">
          <button type="button" className="button" onClick={back} disabled={reviewing === 0}>
            ← Zurück
          </button>
          {reviewing !== null ? (
            <button type="button" className="button" onClick={forward}>
              Weiter →
            </button>
          ) : null}
        </nav>
      ) : null}
    </section>
  );
}
