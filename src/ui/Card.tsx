import { useEffect, useRef, useState } from 'react';
import { answerWord, promptWord, type Direction, type VocabEntry } from '../domain/types';
import { useCardGestures } from './gestures/useCardGestures';
import type { Rating } from '../domain/types';

interface CardProps {
  entry: VocabEntry;
  direction: Direction;
  labels: { from: string; to: string };
  onRate: (rating: Rating) => void;
}

export function Card({ entry, direction, labels, onRate }: CardProps) {
  const [held, setHeld] = useState(false);
  const [pinned, setPinned] = useState(false);
  const revealed = held || pinned;
  const liveRegion = useRef<HTMLDivElement>(null);

  // Jede neue Karte startet verdeckt.
  useEffect(() => {
    setHeld(false);
    setPinned(false);
  }, [entry.key, direction]);

  const { dragX, handlers } = useCardGestures({
    onRate,
    onHold: setHeld,
    onPin: () => {
      setPinned(true);
    },
  });

  const verdict = dragX > 0 ? 'known' : 'unknown';
  const intensity = Math.min(Math.abs(dragX) / 90, 1);

  return (
    <div className="card-stage">
      <div
        className="card"
        style={{
          transform: `translateX(${String(dragX)}px) rotate(${String(dragX * 0.04)}deg)`,
          transition: dragX === 0 ? 'transform 180ms ease-out' : 'none',
        }}
        {...handlers}
      >
        <div
          className={`card-verdict card-verdict--${verdict}`}
          style={{ opacity: intensity }}
          aria-hidden="true"
        >
          {dragX > 0 ? 'Gewusst' : 'Nicht gewusst'}
        </div>

        <p className="card-label">{labels.from}</p>
        <p className="card-word">{promptWord(entry, direction)}</p>

        {revealed ? (
          <div className="card-answer">
            <p className="card-label">{labels.to}</p>
            <p className="card-word card-word--answer">{answerWord(entry, direction)}</p>

            {entry.examples.length > 0 ? (
              <ul className="card-examples">
                {entry.examples.map((example, index) => (
                  <li key={index}>
                    <span>{example.sentenceA}</span>
                    <span className="card-example-b">{example.sentenceB}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="card-hint">Berühren zum Anzeigen, doppelt tippen zum Festhalten</p>
        )}
      </div>

      <div ref={liveRegion} className="visually-hidden" role="status" aria-live="polite">
        {revealed ? answerWord(entry, direction) : ''}
      </div>

      <div className="card-legend" aria-hidden="true">
        <span className="card-legend--bad">◀ nicht gewusst</span>
        <span className="card-legend--good">gewusst ▶</span>
      </div>
    </div>
  );
}
