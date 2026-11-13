import { useMemo, useRef, useState } from 'react';
import { buildRound, emptyTally, type SessionTally } from '../domain/session';
import { directionLabels, type Direction, type VocabList } from '../domain/types';
import type { ProgressRecord, Rating } from '../domain/types';
import { Card } from './Card';

interface SessionViewProps {
  list: VocabList;
  direction: Direction;
  progress: ReadonlyMap<string, ProgressRecord>;
  onRate: (entryKey: string, rating: Rating) => Promise<{ newlyLearned: boolean }>;
  onFinish: (tally: SessionTally) => void;
  onLeave: () => void;
  onReset: () => void;
}

export function SessionView({
  list,
  direction,
  progress,
  onRate,
  onFinish,
  onLeave,
  onReset,
}: SessionViewProps) {
  // Der Durchgang wird beim Betreten einmal festgelegt. `progress` ist bewusst keine
  // Abhängigkeit: Sonst würde ein bewertetes Wort den laufenden Durchgang neu mischen.
  const progressAtStart = useRef(progress);
  const round = useMemo(
    () => buildRound(list.entries, progressAtStart.current, list.id, direction),
    [list.entries, list.id, direction],
  );

  const [position, setPosition] = useState(0);
  const [tally, setTally] = useState<SessionTally>(emptyTally);
  const labels = directionLabels(list, direction);

  if (round.length === 0) {
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

  const entry = round[position];
  if (entry === undefined) {
    return null;
  }

  const handleRate = (rating: Rating): void => {
    void (async () => {
      const { newlyLearned } = await onRate(entry.key, rating);

      const nextTally: SessionTally = {
        known: tally.known + (rating === 'known' ? 1 : 0),
        unknown: tally.unknown + (rating === 'unknown' ? 1 : 0),
        newlyLearned: newlyLearned ? [...tally.newlyLearned, entry.wordA] : tally.newlyLearned,
      };
      setTally(nextTally);

      if (position + 1 >= round.length) {
        onFinish(nextTally);
      } else {
        setPosition(position + 1);
      }
    })();
  };

  return (
    <section className="screen">
      <header className="screen-header">
        <button type="button" className="link-button" onClick={onLeave}>
          ← Übersicht
        </button>
        <span className="screen-progress">
          {position + 1} / {round.length}
        </span>
      </header>

      <progress className="session-bar" value={position} max={round.length} />

      <Card entry={entry} direction={direction} labels={labels} onRate={handleRate} />
    </section>
  );
}
