import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type Settings } from '../domain/settings';
import type { Exercise, ProgressRecord, VocabEntry, VocabList } from '../domain/types';
import { ExerciseSessionView } from './ExerciseSessionView';
import { GESTURE } from './gestures/gestureMachine';
import { SessionView } from './SessionView';
import { SettingsView } from './SettingsView';
import { VocabularyOverview } from './VocabularyOverview';

function entry(index: number): VocabEntry {
  return {
    key: `wort${index}|word${index}`,
    wordA: `Wort${index}`,
    wordB: `word${index}`,
    examples: [{ sentenceA: `Satz ${index}`, sentenceB: `Sentence ${index}` }],
  };
}

function makeList(entries: VocabEntry[], exercises: Exercise[] = []): VocabList {
  return {
    id: 'l1',
    name: 'Testliste',
    languageA: 'Deutsch',
    languageB: 'Englisch',
    entries,
    exercises,
    importedAt: 0,
  };
}

function swipe(direction: 1 | -1): void {
  const card = document.querySelector('.card');
  if (card === null) {
    throw new Error('Karte nicht gefunden');
  }
  const end = 200 + direction * GESTURE.swipeThresholdPx;
  fireEvent.pointerDown(card, { clientX: 200, clientY: 200, pointerId: 1 });
  fireEvent.pointerMove(card, { clientX: end, clientY: 200, pointerId: 1 });
  fireEvent.pointerUp(card, { clientX: end, clientY: 200, pointerId: 1 });
}

function shownPrompt(): string | null | undefined {
  return document.querySelector('.card-word')?.textContent;
}

describe('SettingsView', () => {
  function renderSettings(settings: Settings = DEFAULT_SETTINGS) {
    const onChange = vi.fn();
    render(<SettingsView settings={settings} onChange={onChange} onDone={vi.fn()} />);
    return onChange;
  }

  it('zeigt die Standardwerte getrennt für Vokabeln und Übungen', () => {
    renderSettings();

    const size = screen.getByLabelText<HTMLInputElement>('Wörter pro Sitzung');
    expect(size.value).toBe('');
    expect(size.placeholder).toBe('alle');
    expect(screen.getByLabelText<HTMLInputElement>('Richtig in Folge bis gelernt').value).toBe('3');
    expect(screen.getByLabelText<HTMLInputElement>('Übungen pro Sitzung').value).toBe('');
    expect(screen.getByLabelText<HTMLInputElement>('Richtig in Folge bis gelöst').value).toBe('1');
  });

  it('übernimmt eine gültige Sitzungsgröße beim Verlassen des Feldes', () => {
    const onChange = renderSettings();
    const size = screen.getByLabelText('Wörter pro Sitzung');

    fireEvent.change(size, { target: { value: '20' } });
    fireEvent.blur(size);

    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      ...DEFAULT_SETTINGS,
      vocab: { sessionSize: 20, threshold: 3 },
    });
  });

  it('versteht ein geleertes Feld als "alle"', () => {
    const onChange = renderSettings({
      ...DEFAULT_SETTINGS,
      exercises: { sessionSize: 5, threshold: 1 },
    });
    const size = screen.getByLabelText('Übungen pro Sitzung');

    fireEvent.change(size, { target: { value: '' } });
    fireEvent.blur(size);

    expect(onChange.mock.calls[0]?.[0]).toMatchObject({ exercises: { sessionSize: null } });
  });

  it('bietet die Beispiel-JSON zum Herunterladen an', () => {
    renderSettings();

    const link = screen.getByRole('link', { name: 'Beispiel-JSON herunterladen' });

    expect(link.getAttribute('href')).toMatch(/samples\/beispiel-vokabelliste\.json$/);
    expect(link.getAttribute('download')).toBe('beispiel-vokabelliste.json');
  });

  it('übernimmt eine Schwelle von 11 nicht und zeigt wieder den gültigen Wert', () => {
    const onChange = renderSettings();
    const threshold = screen.getByLabelText<HTMLInputElement>('Richtig in Folge bis gelernt');

    fireEvent.change(threshold, { target: { value: '11' } });
    fireEvent.blur(threshold);

    expect(onChange).not.toHaveBeenCalled();
    expect(threshold.value).toBe('3');
  });
});

describe('begrenzte Sitzung', () => {
  it('endet bei Sitzungsgröße 1 nach dem Lernen dieses einen Wortes', async () => {
    const onFinish = vi.fn();
    render(
      <SessionView
        list={makeList([entry(0), entry(1), entry(2)])}
        direction="a-to-b"
        progress={new Map()}
        settings={{ sessionSize: 1, threshold: 3 }}
        onRate={vi.fn(() => Promise.resolve({ newlyLearned: true }))}
        onFinish={onFinish}
        onLeave={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByText('1 offen')).not.toBeNull();
    swipe(1);

    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledOnce();
    });
  });

  it('endet in der Übungssitzung bei Größe 1 nach dem Lösen dieser einen Übung', async () => {
    const exercises: Exercise[] = [0, 1, 2].map((index) => ({
      kind: 'gap',
      key: `gap|${index}`,
      parts: [
        { kind: 'text', text: `Satz ${index} ` },
        { kind: 'gap', text: 'Lücke' },
      ],
    }));
    const onFinish = vi.fn();
    render(
      <ExerciseSessionView
        list={makeList([entry(0)], exercises)}
        progress={new Map()}
        settings={{ sessionSize: 1, threshold: 1 }}
        onAnswer={vi.fn((_key: string, correct: boolean) => Promise.resolve({ newlySolved: correct }))}
        onFinish={onFinish}
        onLeave={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByText('1 offen')).not.toBeNull();
    swipe(1);

    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledOnce();
    });
  });
});

describe('Zurückblättern', () => {
  const entries = Array.from({ length: 13 }, (_, index) => entry(index));
  const wordOf = new Map(entries.map((item) => [item.key, item.wordA]));

  function renderSession() {
    const onRate = vi.fn((_key: string, _rating: string) =>
      Promise.resolve({ newlyLearned: false }),
    );
    render(
      <SessionView
        list={makeList(entries)}
        direction="a-to-b"
        progress={new Map()}
        settings={DEFAULT_SETTINGS.vocab}
        onRate={onRate}
        onFinish={vi.fn()}
        onLeave={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    return onRate;
  }

  async function rate(onRate: ReturnType<typeof renderSession>, times: number): Promise<void> {
    for (let count = 1; count <= times; count += 1) {
      swipe(-1);
      await waitFor(() => {
        expect(onRate).toHaveBeenCalledTimes(count);
      });
      await screen.findByRole('button', { name: '← Zurück' });
    }
  }

  it('bietet "Zurück" erst nach der ersten Bewertung an', async () => {
    const onRate = renderSession();

    expect(screen.queryByRole('button', { name: '← Zurück' })).toBeNull();

    await rate(onRate, 1);
    expect(screen.getByRole('button', { name: '← Zurück' })).not.toBeNull();
  });

  it('zeigt die zehn zuletzt bewerteten Karten rückwärts, aufgedeckt und mit Bewertung', async () => {
    const onRate = renderSession();
    await rate(onRate, 12);

    const ratedWords = onRate.mock.calls.map(([key]) => wordOf.get(key));
    const expected = ratedWords.slice(-10).reverse();

    const shown: (string | null | undefined)[] = [];
    for (let step = 0; step < 10; step += 1) {
      fireEvent.click(screen.getByRole('button', { name: '← Zurück' }));
      shown.push(shownPrompt());
      const review = document.querySelector<HTMLElement>('.card--review');
      expect(review).not.toBeNull();
      expect(within(review!).getByText('Nicht gewusst')).not.toBeNull();
      expect(review!.querySelector('.card-word--answer')).not.toBeNull();
      expect(review!.querySelector('.card-examples')).not.toBeNull();
    }

    expect(shown).toEqual(expected);
  });

  it('wertet Wischen auf einer zurückgeblätterten Karte nicht und führt mit "Weiter" zur aktuellen Karte zurück', async () => {
    const onRate = renderSession();
    await rate(onRate, 3);

    for (let step = 0; step < 3; step += 1) {
      fireEvent.click(screen.getByRole('button', { name: '← Zurück' }));
    }
    swipe(1);
    expect(onRate).toHaveBeenCalledTimes(3);

    for (let step = 0; step < 3; step += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Weiter →' }));
    }

    expect(document.querySelector('.card--review')).toBeNull();
    expect(document.querySelector('.card-answer')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Weiter →' })).toBeNull();
  });
});

describe('VocabularyOverview', () => {
  it('zeigt alle Wortpaare ohne Beispiele mit Gelernt-Markierung je Richtung', () => {
    const list = makeList([entry(0), entry(1)]);
    const learnedAtoB: ProgressRecord = {
      listId: 'l1',
      entryKey: entry(0).key,
      direction: 'a-to-b',
      streak: 3,
      learned: true,
      updatedAt: 0,
    };
    const onDone = vi.fn();
    render(
      <VocabularyOverview
        list={list}
        progress={new Map([[`l1::a-to-b::${entry(0).key}`, learnedAtoB]])}
        threshold={3}
        onDone={onDone}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Deutsch' })).not.toBeNull();
    expect(screen.getByRole('columnheader', { name: 'Englisch' })).not.toBeNull();

    const rows = document.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
    const firstCells = rows[0]!.querySelectorAll('td');
    expect(firstCells[0]?.textContent).toBe('Wort0');
    expect(firstCells[1]?.textContent).toBe('word0');
    expect(within(firstCells[2]!).queryByLabelText('gelernt')).not.toBeNull();
    expect(within(firstCells[3]!).queryByLabelText('gelernt')).toBeNull();
    expect(rows[1]!.querySelectorAll('[aria-label="gelernt"]')).toHaveLength(0);
    expect(screen.queryByText('Satz 0')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '← Übersicht' }));
    expect(onDone).toHaveBeenCalledOnce();
  });
});
