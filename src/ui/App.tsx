import { useState } from 'react';
import { useAppUpdate } from '../app/useAppUpdate';
import { useLibrary } from '../app/useLibrary';
import { useSettings } from '../app/useSettings';
import type { SessionTally } from '../domain/session';
import type { Direction } from '../domain/types';
import { ExerciseSessionView } from './ExerciseSessionView';
import { ImportView } from './ImportView';
import { LibraryView } from './LibraryView';
import { SessionView } from './SessionView';
import { SettingsView } from './SettingsView';
import { EXERCISE_SUMMARY, SummaryView, VOCAB_SUMMARY } from './SummaryView';
import { VocabularyOverview } from './VocabularyOverview';
import './app.css';

type Screen =
  | { name: 'library' }
  | { name: 'import' }
  | { name: 'settings' }
  | { name: 'overview'; listId: string }
  | { name: 'session'; listId: string; direction: Direction }
  | { name: 'exercises'; listId: string }
  | { name: 'summary'; listId: string; tally: SessionTally; again: Screen };

export function App() {
  const library = useLibrary();
  const [settings, setSettings] = useSettings();
  const { updateReady, applyUpdate } = useAppUpdate();
  const [screen, setScreen] = useState<Screen>({ name: 'library' });

  const toLibrary = (): void => {
    setScreen({ name: 'library' });
  };

  const activeList =
    screen.name === 'session' ||
    screen.name === 'exercises' ||
    screen.name === 'summary' ||
    screen.name === 'overview'
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
      ) : screen.name === 'settings' ? (
        <SettingsView settings={settings} onChange={setSettings} onDone={toLibrary} />
      ) : screen.name === 'overview' && activeList !== undefined ? (
        <VocabularyOverview
          list={activeList}
          progress={library.progress}
          threshold={settings.vocab.threshold}
          onDone={toLibrary}
        />
      ) : screen.name === 'session' && activeList !== undefined ? (
        <SessionView
          list={activeList}
          direction={screen.direction}
          progress={library.progress}
          settings={settings.vocab}
          onRate={(entryKey, rating) =>
            library.rate(
              activeList.id,
              entryKey,
              screen.direction,
              rating,
              settings.vocab.threshold,
            )
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
          settings={settings.exercises}
          onAnswer={(exerciseKey, correct) =>
            library.answerExercise(
              activeList.id,
              exerciseKey,
              correct,
              settings.exercises.threshold,
            )
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
          settings={settings}
          onStart={(listId, direction) => {
            setScreen({ name: 'session', listId, direction });
          }}
          onStartExercises={(listId) => {
            setScreen({ name: 'exercises', listId });
          }}
          onShowOverview={(listId) => {
            setScreen({ name: 'overview', listId });
          }}
          onOpenSettings={() => {
            setScreen({ name: 'settings' });
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
