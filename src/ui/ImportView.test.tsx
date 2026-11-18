import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ImportSummary } from '../app/useLibrary';
import type { ImportOutcome } from '../import/validate';
import { ImportView } from './ImportView';

const outcome = {
  list: {
    id: 'neu',
    name: 'Verben',
    languageA: 'Spanisch',
    languageB: 'Deutsch',
    entries: [],
    exercises: [],
    importedAt: 0,
  },
  issues: [],
} satisfies ImportOutcome;

describe('ImportView', () => {
  it('zeigt die Anzahl importierter Übungen und gemeldete Übungsfehler', async () => {
    const summary: ImportSummary = {
      listName: 'Verben',
      imported: 20,
      exercises: 10,
      issues: [
        { position: 4, reason: 'Wort in Sprache B fehlt' },
        { position: 3, reason: 'Keine Lücke markiert', scope: 'exercise' },
      ],
    };
    const { container } = render(
      <ImportView
        lists={[]}
        onReadFile={vi.fn(() => Promise.resolve(outcome))}
        onImport={vi.fn(() => Promise.resolve(summary))}
        onDone={vi.fn()}
      />,
    );

    const input = container.querySelector('input[type="file"]');
    if (input === null) {
      throw new Error('Dateiauswahl nicht gefunden');
    }
    fireEvent.change(input, {
      target: { files: [new File(['{}'], 'verben.json', { type: 'application/json' })] },
    });

    expect(await screen.findByText(/20 Einträge und 10 Übungen in „Verben“ importiert/)).not.toBeNull();
    expect(screen.getByText('Position 4: Wort in Sprache B fehlt')).not.toBeNull();
    expect(screen.getByText('Übung 3: Keine Lücke markiert')).not.toBeNull();
  });
});
