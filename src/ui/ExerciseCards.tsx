import { useState } from 'react';
import type { ChoiceExercise, GapExercise } from '../domain/types';
import { useCardGestures } from './gestures/useCardGestures';

interface GapCardProps {
  exercise: GapExercise;
  onResult: (correct: boolean) => void;
}

/** Lückentext: Berühren zeigt die Lösung, Doppeltipp hält sie fest, Wischen bewertet. */
export function GapCard({ exercise, onResult }: GapCardProps) {
  const [held, setHeld] = useState(false);
  const [pinned, setPinned] = useState(false);
  const revealed = held || pinned;

  const { dragX, handlers } = useCardGestures({
    onRate: (rating) => {
      onResult(rating === 'known');
    },
    onHold: setHeld,
    onPin: () => {
      setPinned(true);
    },
  });

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
          className={`card-verdict card-verdict--${dragX > 0 ? 'known' : 'unknown'}`}
          style={{ opacity: intensity }}
          aria-hidden="true"
        >
          {dragX > 0 ? 'Richtig' : 'Falsch'}
        </div>

        <p className="card-label">Lückentext</p>
        <p className="exercise-sentence">
          {exercise.parts.map((part, index) => {
            if (part.kind === 'text') {
              return <span key={index}>{part.text}</span>;
            }
            return revealed ? (
              <mark key={index} className="gap gap--filled">
                {part.text}
              </mark>
            ) : (
              <span key={index} className="gap" aria-label="Lücke" />
            );
          })}
        </p>

        {!revealed ? (
          <p className="card-hint">Berühren zum Anzeigen, doppelt tippen zum Festhalten</p>
        ) : exercise.explanation !== undefined ? (
          <p className="exercise-explanation">{exercise.explanation}</p>
        ) : null}
      </div>

      <div className="card-legend" aria-hidden="true">
        <span className="card-legend--bad">◀ falsch</span>
        <span className="card-legend--good">richtig ▶</span>
      </div>
    </div>
  );
}

interface ChoiceCardProps {
  exercise: ChoiceExercise;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Auswahlfrage: Die erste gewählte Antwort zählt und wird sofort ausgewertet. */
export function ChoiceCard({ exercise, onAnswer, onNext }: ChoiceCardProps) {
  const [chosen, setChosen] = useState<number | undefined>(undefined);
  const answered = chosen !== undefined;
  const correct = chosen === exercise.answerIndex;

  const choose = (index: number): void => {
    if (answered) {
      return;
    }
    setChosen(index);
    onAnswer(index === exercise.answerIndex);
  };

  return (
    <div className="card-stage">
      <div className="card card--static">
        <p className="card-label">Auswahlfrage</p>
        <p className="exercise-question">{exercise.question}</p>

        <ol className="choice-list">
          {exercise.options.map((option, index) => {
            const isAnswer = index === exercise.answerIndex;
            const state = !answered
              ? ''
              : isAnswer
                ? ' choice--correct'
                : index === chosen
                  ? ' choice--wrong'
                  : '';
            return (
              <li key={index}>
                <button
                  type="button"
                  className={`choice${state}`}
                  disabled={answered}
                  onClick={() => {
                    choose(index);
                  }}
                >
                  <span className="choice-letter">{LETTERS[index] ?? String(index + 1)}</span>
                  <span>{option}</span>
                  {answered && isAnswer ? (
                    <span className="visually-hidden"> – richtige Antwort</span>
                  ) : null}
                  {answered && !isAnswer && index === chosen ? (
                    <span className="visually-hidden"> – gewählt, falsch</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>

        {answered ? (
          <>
            <p
              className={`exercise-verdict exercise-verdict--${correct ? 'good' : 'bad'}`}
              role="status"
            >
              {correct ? 'Richtig!' : 'Leider falsch.'}
            </p>
            {exercise.explanation !== undefined ? (
              <p className="exercise-explanation">{exercise.explanation}</p>
            ) : null}
            <button type="button" className="button button--primary" onClick={onNext}>
              Weiter
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
