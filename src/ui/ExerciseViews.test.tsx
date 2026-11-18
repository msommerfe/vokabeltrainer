import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ChoiceExercise, Exercise, GapExercise, VocabList } from '../domain/types';
import { ChoiceCard, GapCard } from './ExerciseCards';
import { ExerciseSessionView } from './ExerciseSessionView';
import { GESTURE } from './gestures/gestureMachine';
import { LibraryView } from './LibraryView';

const gap: GapExercise = {
  kind: 'gap',
  key: 'gap|yo {hablo} y tú {hablas}.',
  parts: [
    { kind: 'text', text: 'Yo ' },
    { kind: 'gap', text: 'hablo' },
    { kind: 'text', text: ' y tú ' },
    { kind: 'gap', text: 'hablas' },
    { kind: 'text', text: '.' },
  ],
  explanation: 'hablar im Präsens',
};

const question: ChoiceExercise = {
  kind: 'choice',
  key: 'choice|nosotros|vivimos',
  question: 'Nosotros ___ en Madrid.',
  options: ['vivo', 'vivimos', 'viven'],
  answerIndex: 1,
  explanation: 'nosotros → -imos',
};

function makeList(exercises: Exercise[]): VocabList {
  return {
    id: 'l1',
    name: 'Verben',
    languageA: 'Spanisch',
    languageB: 'Deutsch',
    entries: [{ key: 'hablar|sprechen', wordA: 'hablar', wordB: 'sprechen', examples: [] }],
    exercises,
    importedAt: 0,
  };
}

function cardOf(container: HTMLElement): HTMLElement {
  const card = container.querySelector<HTMLElement>('.card');
  if (card === null) {
    throw new Error('Karte nicht gefunden');
  }
  return card;
}

function tap(card: Element, time: number): void {
  fireEvent.pointerDown(card, { clientX: 100, clientY: 200, pointerId: 1 });
  fireEvent.pointerUp(card, { clientX: 100, clientY: 200, pointerId: 1, timeStamp: time });
}

function swipe(card: Element, direction: 1 | -1): void {
  const end = 200 + direction * GESTURE.swipeThresholdPx;
  fireEvent.pointerDown(card, { clientX: 200, clientY: 200, pointerId: 1 });
  fireEvent.pointerMove(card, { clientX: end, clientY: 200, pointerId: 1 });
  fireEvent.pointerUp(card, { clientX: end, clientY: 200, pointerId: 1 });
}

describe('LibraryView mit Übungen', () => {
  function renderLibrary(lists: VocabList[]) {
    const handlers = {
      onStartExercises: vi.fn(),
      onReset: vi.fn(),
      onResetExercises: vi.fn(),
    };
    render(
      <LibraryView
        lists={lists}
        progress={new Map()}
        exerciseProgress={new Map([
          ['l1::exercise::' + gap.key, { listId: 'l1', exerciseKey: gap.key, solved: true, updatedAt: 0 }],
        ])}
        onStart={vi.fn()}
        onImport={vi.fn()}
        onDelete={vi.fn()}
        {...handlers}
      />,
    );
    return handlers;
  }

  it('zeigt die Kachel "Übungen" mit gelösten und offenen Übungen', () => {
    const { onStartExercises } = renderLibrary([makeList([gap, question])]);

    const tile = screen.getByRole('button', { name: /Übungen\s*1 gelöst · 1 offen/ });
    fireEvent.click(tile);

    expect(onStartExercises).toHaveBeenCalledExactlyOnceWith('l1');
  });

  it('zeigt bei einer Liste ohne Übungen weder Kachel noch Zurücksetzen der Übungen', () => {
    renderLibrary([makeList([])]);

    expect(screen.queryByText('Übungen')).toBeNull();
    expect(screen.queryByText('Übungen zurücksetzen')).toBeNull();
  });

  it('setzt die Übungen nur nach Bestätigung zurück', () => {
    const { onResetExercises, onReset } = renderLibrary([makeList([gap])]);

    fireEvent.click(screen.getByRole('button', { name: 'Übungen zurücksetzen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(onResetExercises).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Übungen zurücksetzen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zurücksetzen' }));
    expect(onResetExercises).toHaveBeenCalledExactlyOnceWith('l1');
    expect(onReset).not.toHaveBeenCalled();
  });
});

describe('GapCard', () => {
  it('zeigt beide Lücken nur während der Berührung', () => {
    const { container } = render(<GapCard exercise={gap} onResult={vi.fn()} />);
    const card = cardOf(container);

    expect(within(card).queryByText('hablo')).toBeNull();
    expect(within(card).getAllByLabelText('Lücke')).toHaveLength(2);

    fireEvent.pointerDown(card, { clientX: 100, clientY: 200, pointerId: 1 });
    expect(within(card).getByText('hablo')).not.toBeNull();
    expect(within(card).getByText('hablas')).not.toBeNull();
    expect(within(card).getByText('hablar im Präsens')).not.toBeNull();

    fireEvent.pointerUp(card, { clientX: 100, clientY: 200, pointerId: 1, timeStamp: 900 });
    expect(within(card).queryByText('hablo')).toBeNull();
    expect(within(card).queryByText('hablar im Präsens')).toBeNull();
  });

  it('hält die Lösung nach einem Doppeltipp fest', () => {
    const { container } = render(<GapCard exercise={gap} onResult={vi.fn()} />);
    const card = cardOf(container);

    tap(card, 10);
    tap(card, 100);

    expect(within(card).getByText('hablo')).not.toBeNull();
    expect(within(card).getByText('hablas')).not.toBeNull();
  });

  it('wertet Wischen nach rechts als richtig und nach links als falsch', () => {
    const onResult = vi.fn();
    const { container } = render(<GapCard exercise={gap} onResult={onResult} />);

    swipe(cardOf(container), 1);
    swipe(cardOf(container), -1);

    expect(onResult.mock.calls).toEqual([[true], [false]]);
  });
});

describe('ChoiceCard', () => {
  it('kennzeichnet nach einer falschen Wahl falsche und richtige Antwort und zeigt die Erklärung', () => {
    const onAnswer = vi.fn();
    const onNext = vi.fn();
    render(<ChoiceCard exercise={question} onAnswer={onAnswer} onNext={onNext} />);

    expect(screen.queryByText('nosotros → -imos')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /^A\s*vivo/ }));

    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false);
    const wrong = screen.getByText('vivo').closest('button');
    const right = screen.getByText('vivimos').closest('button');
    expect(wrong?.className).toContain('choice--wrong');
    expect(wrong?.textContent).toContain('gewählt, falsch');
    expect(right?.className).toContain('choice--correct');
    expect(right?.textContent).toContain('richtige Antwort');
    expect(screen.getByText('Leider falsch.')).not.toBeNull();
    expect(screen.getByText('nosotros → -imos')).not.toBeNull();

    if (right !== null) {
      fireEvent.click(right);
    }
    expect(onAnswer).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('wertet die richtige Antwort als richtig', () => {
    const onAnswer = vi.fn();
    render(<ChoiceCard exercise={question} onAnswer={onAnswer} onNext={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /^B\s*vivimos/ }));

    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true);
    expect(screen.getByText('Richtig!')).not.toBeNull();
  });
});

describe('ExerciseSessionView', () => {
  function renderSession(exercises: Exercise[]) {
    const onAnswer = vi.fn((_key: string, correct: boolean) =>
      Promise.resolve({ newlySolved: correct }),
    );
    const onFinish = vi.fn();
    const utils = render(
      <ExerciseSessionView
        list={makeList(exercises)}
        progress={new Map()}
        onAnswer={onAnswer}
        onFinish={onFinish}
        onLeave={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    return { ...utils, onAnswer, onFinish };
  }

  it('nimmt gelöste Übungen sofort heraus und endet nach der letzten', async () => {
    const { container, onFinish } = renderSession([gap, question]);

    expect(screen.getByText('2 offen')).not.toBeNull();

    for (let step = 0; step < 2; step += 1) {
      if (container.querySelector('.choice') !== null) {
        fireEvent.click(screen.getByRole('button', { name: /vivimos/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
      } else {
        swipe(cardOf(container), 1);
      }
      if (step === 0) {
        await screen.findByText('1 offen');
      }
    }

    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledOnce();
    });
    expect(onFinish.mock.calls[0]?.[0]).toMatchObject({ known: 2, unknown: 0 });
  });

  it('legt eine falsch gelöste Übung erneut vor und zählt sie als falsch', async () => {
    const { container, onAnswer } = renderSession([gap]);

    swipe(cardOf(container), -1);
    await waitFor(() => {
      expect(onAnswer).toHaveBeenCalledOnce();
    });

    expect(screen.getByText('1 offen')).not.toBeNull();
    expect(container.querySelector('.card')).not.toBeNull();
  });

  it('bietet bei vollständig gelösten Übungen das Zurücksetzen an', () => {
    render(
      <ExerciseSessionView
        list={makeList([gap])}
        progress={new Map([
          ['l1::exercise::' + gap.key, { listId: 'l1', exerciseKey: gap.key, solved: true, updatedAt: 0 }],
        ])}
        onAnswer={vi.fn()}
        onFinish={vi.fn()}
        onLeave={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByText('Alle Übungen gelöst')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Übungsfortschritt zurücksetzen' })).not.toBeNull();
  });

  it('zeigt die Zusammenfassung, wenn der Nutzer beendet', () => {
    const onFinish = vi.fn();
    render(
      <ExerciseSessionView
        list={makeList([gap, question])}
        progress={new Map()}
        onAnswer={vi.fn()}
        onFinish={onFinish}
        onLeave={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Beenden' }));

    expect(onFinish).toHaveBeenCalledExactlyOnceWith({ known: 0, unknown: 0, newlyLearned: [] });
  });
});

describe('Übungsinhalte als Text', () => {
  it('interpretiert Markup in Satz, Frage, Optionen und Erklärung nicht', () => {
    const markupGap: GapExercise = {
      kind: 'gap',
      key: 'gap|markup',
      parts: [
        { kind: 'text', text: '<b>fett</b> ' },
        { kind: 'gap', text: '<img src=x onerror="alert(1)">' },
      ],
      explanation: '<script>alert(2)</script>',
    };
    const markupChoice: ChoiceExercise = {
      kind: 'choice',
      key: 'choice|markup',
      question: '<i>kursiv</i>',
      options: ['<b>a</b>', '<u>b</u>'],
      answerIndex: 0,
      explanation: '<b>wichtig</b>',
    };

    const gapView = render(<GapCard exercise={markupGap} onResult={vi.fn()} />);
    const card = cardOf(gapView.container);
    tap(card, 10);
    tap(card, 100);
    expect(within(card).getByText('<img src=x onerror="alert(1)">')).not.toBeNull();
    expect(within(card).getByText('<script>alert(2)</script>')).not.toBeNull();
    expect(gapView.container.querySelector('b, img, script')).toBeNull();
    gapView.unmount();

    const choiceView = render(
      <ChoiceCard exercise={markupChoice} onAnswer={vi.fn()} onNext={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /<u>b<\/u>/ }));
    expect(screen.getByText('<i>kursiv</i>')).not.toBeNull();
    expect(screen.getByText('<b>wichtig</b>')).not.toBeNull();
    expect(choiceView.container.querySelector('b, i, u')).toBeNull();
  });
});
