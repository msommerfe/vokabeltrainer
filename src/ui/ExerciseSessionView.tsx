import { useMemo, useRef, useState } from 'react';
import type { ExerciseOutcome } from '../app/useLibrary';
import { exerciseLabel, openExercises, type ExerciseProgressIndex } from '../domain/exercises';
import { drawNext, emptyTally, type SessionTally } from '../domain/session';
import type { Exercise, VocabList } from '../domain/types';
import { ChoiceCard, GapCard } from './ExerciseCards';

interface ExerciseSessionViewProps {
  list: VocabList;
  progress: ExerciseProgressIndex;
  onAnswer: (exerciseKey: string, correct: boolean) => Promise<ExerciseOutcome>;
  onFinish: (tally: SessionTally) => void;
  onLeave: () => void;
  onReset: () => void;
}

interface Recorded {
  tally: SessionTally;
  solved: ReadonlySet<string>;
}

export function ExerciseSessionView({
  list,
  progress,
  onAnswer,
  onFinish,
  onLeave,
  onReset,
}: ExerciseSessionViewProps) {
  // Offene Übungen werden beim Betreten festgelegt; währenddessen fallen nur neu gelöste heraus.
  const progressAtStart = useRef(progress);
  const initialOpen = useMemo(
    () => openExercises(list.exercises, progressAtStart.current, list.id),
    [list.exercises, list.id],
  );

  const [current, setCurrent] = useState(() => drawNext(initialOpen));
  const [draws, setDraws] = useState(0);
  const [solvedKeys, setSolvedKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [tally, setTally] = useState<SessionTally>(emptyTally);
  // Bei Auswahlfragen kann "Weiter" vor dem Speichern der Antwort getippt werden.
  const pending = useRef<Promise<Recorded> | undefined>(undefined);

  if (initialOpen.length === 0) {
    return (
      <section className="screen">
        <header className="screen-header">
          <button type="button" className="link-button" onClick={onLeave}>
            ← Übersicht
          </button>
        </header>
        <div className="empty-state">
          <h2>Alle Übungen gelöst</h2>
          <p>Jede Übung der Liste „{list.name}“ wurde bereits richtig gelöst.</p>
          <button type="button" className="button button--primary" onClick={onReset}>
            Übungsfortschritt zurücksetzen
          </button>
        </div>
      </section>
    );
  }

  if (current === undefined) {
    return null;
  }

  const remaining = initialOpen.length - solvedKeys.size;

  const record = async (exercise: Exercise, correct: boolean): Promise<Recorded> => {
    const { newlySolved } = await onAnswer(exercise.key, correct);
    const nextTally: SessionTally = {
      known: tally.known + (correct ? 1 : 0),
      unknown: tally.unknown + (correct ? 0 : 1),
      newlyLearned: newlySolved
        ? [...tally.newlyLearned, exerciseLabel(exercise)]
        : tally.newlyLearned,
    };
    const nextSolved = newlySolved ? new Set(solvedKeys).add(exercise.key) : solvedKeys;
    setTally(nextTally);
    setSolvedKeys(nextSolved);
    return { tally: nextTally, solved: nextSolved };
  };

  const advance = (previousKey: string, recorded: Recorded): void => {
    const next = drawNext(
      initialOpen.filter((exercise) => !recorded.solved.has(exercise.key)),
      previousKey,
    );
    if (next === undefined) {
      onFinish(recorded.tally);
    } else {
      pending.current = undefined;
      setCurrent(next);
      setDraws((count) => count + 1);
    }
  };

  const exercise = current;

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
        value={list.exercises.length - remaining}
        max={list.exercises.length}
      />

      {exercise.kind === 'gap' ? (
        <GapCard
          key={draws}
          exercise={exercise}
          onResult={(correct) => {
            void (async () => {
              advance(exercise.key, await record(exercise, correct));
            })();
          }}
        />
      ) : (
        <ChoiceCard
          key={draws}
          exercise={exercise}
          onAnswer={(correct) => {
            pending.current = record(exercise, correct);
          }}
          onNext={() => {
            void (async () => {
              const recorded = await pending.current;
              if (recorded !== undefined) {
                advance(exercise.key, recorded);
              }
            })();
          }}
        />
      )}
    </section>
  );
}
