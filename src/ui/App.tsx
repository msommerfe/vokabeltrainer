import { useState } from 'react';
import { useAppUpdate } from '../app/useAppUpdate';
import { useLibrary } from '../app/useLibrary';
import type { SessionTally } from '../domain/session';
import type { Direction } from '../domain/types';
import { ExerciseSessionView } from './ExerciseSessionView';
import { ImportView } from './ImportView';
import { LibraryView } from './LibraryView';
import { SessionView } from './SessionView';
import { EXERCISE_SUMMARY, SummaryView, VOCAB_SUMMARY } from './SummaryView';
import './app.css';

type Screen =
  | { name: 'library' }
  | { name: 'import' }
  | { name: 'session'; listId: string; direction: Direction }
  | { name: 'exercises'; listId: string }
  | { name: 'summary'; listId: string; tally: SessionTally; again: Screen };

export function App() {
  const library = useLibrary();
  const { updateReady, applyUpdate } = useAppUpdate();
  const [screen, setScreen] = useState<Screen>({ name: 'library' });

  const toLibrary = (): void => {
    setScreen({ name: 'library' });
  };

  const activeList =
    screen.name === 'session' || screen.name === 'exercises' || screen.name === 'summary'
      ? library.lists.find((list) => list.id === screen.listId)
      : undefined;

  return (
    <>
      {updateReady ? (
        <div className="banner" role="status">
          <span>Eine neue Version ist verfügbar.</span>
          <button type="button" className="link-button" onClick={applyUpdate}>
            Jetzt aktualisieren
          </button>
        </div>
      ) : null}

      {library.notice !== undefined ? (
        <div className="banner" role="alert">
          <span>{library.notice}</span>
          <button type="button" className="link-button" onClick={library.dismissNotice}>
            Schließen
          </button>
        </div>
      ) : null}

      {!library.ready ? (
        <p className="screen muted">Lade …</p>
      ) : screen.name === 'import' ? (
        <ImportView
          lists={library.lists}
          onReadFile={library.readFile}
          onImport={library.importOutcome}
          onDone={toLibrary}
        />
      ) : screen.name === 'session' && activeList !== undefined ? (
        <SessionView
          list={activeList}
          direction={screen.direction}
          progress={library.progress}
          onRate={(entryKey, rating) =>
            library.rate(activeList.id, entryKey, screen.direction, rating)
          }
          onFinish={(tally) => {
            setScreen({ name: 'summary', listId: activeList.id, tally, again: screen });
          }}
          onLeave={toLibrary}
          onReset={() => {
            void library.resetList(activeList.id).then(toLibrary);
          }}
        />
      ) : screen.name === 'exercises' && activeList !== undefined ? (
        <ExerciseSessionView
          list={activeList}
          progress={library.exerciseProgress}
          onAnswer={(exerciseKey, correct) =>
            library.answerExercise(activeList.id, exerciseKey, correct)
          }
          onFinish={(tally) => {
            setScreen({ name: 'summary', listId: activeList.id, tally, again: screen });
          }}
          onLeave={toLibrary}
          onReset={() => {
            void library.resetExercises(activeList.id).then(toLibrary);
          }}
        />
      ) : screen.name === 'summary' && activeList !== undefined ? (
        <SummaryView
          tally={screen.tally}
          labels={screen.again.name === 'exercises' ? EXERCISE_SUMMARY : VOCAB_SUMMARY}
          onBack={toLibrary}
          onAgain={() => {
            setScreen(screen.again);
          }}
        />
      ) : (
        <LibraryView
          lists={library.lists}
          progress={library.progress}
          exerciseProgress={library.exerciseProgress}
          onStart={(listId, direction) => {
            setScreen({ name: 'session', listId, direction });
          }}
          onStartExercises={(listId) => {
            setScreen({ name: 'exercises', listId });
          }}
          onImport={() => {
            setScreen({ name: 'import' });
          }}
          onReset={(listId) => {
            void library.resetList(listId);
          }}
          onResetExercises={(listId) => {
            void library.resetExercises(listId);
          }}
          onDelete={(listId) => {
            void library.deleteList(listId);
          }}
        />
      )}
    </>
  );
}
