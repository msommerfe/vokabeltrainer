import { isLearned, type ProgressIndex } from '../domain/progress';
import type { Direction, VocabList } from '../domain/types';

interface VocabularyOverviewProps {
  list: VocabList;
  progress: ProgressIndex;
  threshold: number;
  onDone: () => void;
}

/** Alle Wortpaare einer Liste auf einen Blick, mit Gelernt-Markierung je Richtung. */
export function VocabularyOverview({ list, progress, threshold, onDone }: VocabularyOverviewProps) {
  const mark = (entryKey: string, direction: Direction) =>
    isLearned(progress, list.id, entryKey, direction, threshold) ? (
      <span title="gelernt" aria-label="gelernt">
        ✓
      </span>
    ) : (
      <span className="visually-hidden">offen</span>
    );

  return (
    <section className="screen">
      <header className="screen-header">
        <button type="button" className="link-button" onClick={onDone}>
          ← Übersicht
        </button>
        <span className="screen-progress">{list.entries.length} Wörter</span>
      </header>

      <h2>{list.name}</h2>

      <table className="overview-table">
        <thead>
          <tr>
            <th scope="col">{list.languageA}</th>
            <th scope="col">{list.languageB}</th>
            <th scope="col" className="overview-mark" title={`${list.languageA} → ${list.languageB}`}>
              A→B
            </th>
            <th scope="col" className="overview-mark" title={`${list.languageB} → ${list.languageA}`}>
              B→A
            </th>
          </tr>
        </thead>
        <tbody>
          {list.entries.map((entry) => (
            <tr key={entry.key}>
              <td>{entry.wordA}</td>
              <td>{entry.wordB}</td>
              <td className="overview-mark">{mark(entry.key, 'a-to-b')}</td>
              <td className="overview-mark">{mark(entry.key, 'b-to-a')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
