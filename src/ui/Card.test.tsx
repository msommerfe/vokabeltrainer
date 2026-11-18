import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VocabEntry } from '../domain/types';
import { Card } from './Card';
import { GESTURE } from './gestures/gestureMachine';

const labels = { from: 'Deutsch', to: 'Englisch' };

function renderCard(entry: VocabEntry, onRate = vi.fn()) {
  const utils = render(
    <Card entry={entry} direction="a-to-b" labels={labels} onRate={onRate} />,
  );
  const card = utils.container.querySelector<HTMLElement>('.card');
  if (card === null) {
    throw new Error('Karte nicht gefunden');
  }
  return { ...utils, card, onRate };
}

function tap(card: Element, time: number): void {
  fireEvent.pointerDown(card, { clientX: 100, clientY: 200, pointerId: 1 });
  fireEvent.pointerUp(card, { clientX: 100, clientY: 200, pointerId: 1, timeStamp: time });
}

function doubleTap(card: Element): void {
  tap(card, 10);
  tap(card, 100);
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Card', () => {
  const plain: VocabEntry = {
    key: 'haus|house',
    wordA: 'das Haus',
    wordB: 'the house',
    examples: [
      { sentenceA: 'Das Haus ist alt.', sentenceB: 'The house is old.' },
      { sentenceA: 'Ein rotes Haus.', sentenceB: 'A red house.' },
    ],
  };

  it('zeigt die Übersetzung nur, solange die Karte berührt wird', () => {
    const { card } = renderCard(plain);

    expect(within(card).queryByText('the house')).toBeNull();

    fireEvent.pointerDown(card, { clientX: 100, clientY: 200, pointerId: 1 });
    expect(within(card).getByText('the house')).not.toBeNull();

    fireEvent.pointerUp(card, { clientX: 100, clientY: 200, pointerId: 1, timeStamp: 900 });
    expect(within(card).queryByText('the house')).toBeNull();
  });

  it('hält die Übersetzung nach einem Doppeltipp dauerhaft sichtbar', () => {
    const { card } = renderCard(plain);

    doubleTap(card);

    expect(within(card).getByText('the house')).not.toBeNull();
  });

  it('startet die nächste Karte nach einem Doppeltipp wieder verdeckt', () => {
    const { card, rerender } = renderCard(plain);
    doubleTap(card);

    const next: VocabEntry = { key: 'hund|dog', wordA: 'der Hund', wordB: 'the dog', examples: [] };
    rerender(<Card entry={next} direction="a-to-b" labels={labels} onRate={vi.fn()} />);

    expect(within(card).queryByText('the dog')).toBeNull();
  });

  it('zeigt beim Aufdecken alle Beispiele in beiden Sprachen', () => {
    const { card } = renderCard(plain);

    doubleTap(card);

    expect(screen.getByText('Das Haus ist alt.')).not.toBeNull();
    expect(screen.getByText('The house is old.')).not.toBeNull();
    expect(screen.getByText('Ein rotes Haus.')).not.toBeNull();
    expect(screen.getByText('A red house.')).not.toBeNull();
  });

  it('wertet eine Wischgeste nach rechts als "gewusst"', () => {
    const { card, onRate } = renderCard(plain);
    const end = 100 + GESTURE.swipeThresholdPx;

    fireEvent.pointerDown(card, { clientX: 100, clientY: 200, pointerId: 1 });
    fireEvent.pointerMove(card, { clientX: end, clientY: 200, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: end, clientY: 200, pointerId: 1 });

    expect(onRate).toHaveBeenCalledExactlyOnceWith('known');
  });

  it('wertet eine Wischgeste nach links als "nicht gewusst"', () => {
    const { card, onRate } = renderCard(plain);
    const end = 300 - GESTURE.swipeThresholdPx;

    fireEvent.pointerDown(card, { clientX: 300, clientY: 200, pointerId: 1 });
    fireEvent.pointerMove(card, { clientX: end, clientY: 200, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: end, clientY: 200, pointerId: 1 });

    expect(onRate).toHaveBeenCalledExactlyOnceWith('unknown');
  });

  it('zeigt die Übersetzung während des Wischens und bewertet trotzdem', () => {
    const { card, onRate } = renderCard(plain);
    const end = 100 + GESTURE.swipeThresholdPx;

    fireEvent.pointerDown(card, { clientX: 100, clientY: 200, pointerId: 1 });
    fireEvent.pointerMove(card, { clientX: end, clientY: 200, pointerId: 1 });

    expect(within(card).getByText('the house')).not.toBeNull();

    fireEvent.pointerUp(card, { clientX: end, clientY: 200, pointerId: 1 });

    expect(onRate).toHaveBeenCalledOnce();
  });

  it('unterdrückt das Kontextmenü auf der Karte', () => {
    const { card } = renderCard(plain);

    const prevented = !fireEvent.contextMenu(card);

    expect(prevented).toBe(true);
  });

  it('rendert importiertes Markup als Text statt es zu interpretieren', () => {
    const malicious: VocabEntry = {
      key: 'markup',
      wordA: '<b>fett</b>',
      wordB: '<img src=x onerror="alert(1)">',
      examples: [
        { sentenceA: '<script>alert(2)</script>', sentenceB: '<i>kursiv</i>' },
      ],
    };

    const { card, container } = renderCard(malicious);
    doubleTap(card);

    expect(within(card).getByText('<img src=x onerror="alert(1)">')).not.toBeNull();
    expect(within(card).getByText('<script>alert(2)</script>')).not.toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('i')).toBeNull();
  });
});
