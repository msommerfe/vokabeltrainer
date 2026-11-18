import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { VocabList } from '../domain/types';
import { GESTURE } from './gestures/gestureMachine';
import { SessionView } from './SessionView';

const list: VocabList = {
  id: 'liste-1',
  name: 'Test',
  languageA: 'Deutsch',
  languageB: 'Englisch',
  importedAt: 0,
  entries: [
    { key: 'haus|house', wordA: 'das Haus', wordB: 'the house', examples: [] },
    { key: 'hund|dog', wordA: 'der Hund', wordB: 'the dog', examples: [] },
  ],
};

function swipeRight(): void {
  const card = document.querySelector('.card');
  if (card === null) {
    throw new Error('Karte nicht gefunden');
  }
  const end = 100 + GESTURE.swipeThresholdPx;
  fireEvent.pointerDown(card, { clientX: 100, clientY: 200, pointerId: 1 });
  fireEvent.pointerMove(card, { clientX: end, clientY: 200, pointerId: 1 });
  fireEvent.pointerUp(card, { clientX: end, clientY: 200, pointerId: 1 });
}

function renderSession(onRate = vi.fn(() => Promise.resolve({ newlyLearned: true }))) {
  const onFinish = vi.fn();
  render(
    <SessionView
      list={list}
      direction="a-to-b"
      progress={new Map()}
      onRate={onRate}
      onFinish={onFinish}
      onLeave={vi.fn()}
      onReset={vi.fn()}
    />,
  );
  return { onFinish, onRate };
}

describe('SessionView', () => {
  it('nimmt gelernte Wörter sofort heraus und endet, wenn alle gelernt sind', async () => {
    const { onFinish, onRate } = renderSession();

    expect(screen.getByText('2 offen')).not.toBeNull();

    swipeRight();
    await screen.findByText('1 offen');
    swipeRight();

    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledOnce();
    });
    const ratedKeys = onRate.mock.calls.map((call) => (call as unknown[])[0]);
    expect(new Set(ratedKeys).size).toBe(2);
    expect(onFinish.mock.calls[0]?.[0]).toMatchObject({ known: 2, unknown: 0 });
  });

  it('zeigt die Zusammenfassung, wenn der Nutzer beendet', () => {
    const { onFinish } = renderSession();

    fireEvent.click(screen.getByRole('button', { name: 'Beenden' }));

    expect(onFinish).toHaveBeenCalledExactlyOnceWith({ known: 0, unknown: 0, newlyLearned: [] });
  });
});
