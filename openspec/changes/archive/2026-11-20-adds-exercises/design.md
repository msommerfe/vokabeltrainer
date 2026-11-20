# Design

## Context

Motivation und Umfang: siehe `proposal.md`. Anforderungen: siehe `specs/`.

Ausgangslage im Code:

- `VocabList` enthält nur `entries`. Der JSON-Import (`src/import/json.ts`) liest Einträge und leitet sie über `buildList`/`validateEntries` (`src/import/validate.ts`) durch eine gemeinsame Validierung, die fehlerhafte Positionen als `ImportIssue` meldet.
- IndexedDB (`src/storage/indexeddb.ts`, `DB_VERSION = 1`) hat die Stores `lists` und `progress`. `VocabStore` wird von IndexedDB-, Memory- und Resilient-Store implementiert.
- Die Beispiellisten werden in `useLibrary.ts` nur beim allerersten Start geladen (Flag `vokabeltrainer.samples-seeded` in `localStorage`). Bestehende Installationen würden geänderte Beispiellisten nie erhalten.
- Beim Ersetzen einer Liste übernimmt `importOutcome` den Fortschritt unveränderter Wörter über `pruneProgressToEntries` und `rebaseProgressToList`.
- Die Vokabelsitzung nutzt `drawNext` (`src/domain/session.ts`) für zufälliges Ziehen ohne direkte Wiederholung und die Gestenmaschine (`src/ui/gestures/`) für Berühren, Doppeltipp und Wischen.

## Goals / Non-Goals

**Goals:**

- Übungen als Teil einer Liste modellieren, damit Import, Ersetzen und Löschen sie automatisch mitnehmen.
- Ziehlogik und Gestensteuerung der Vokabelsitzung wiederverwenden statt duplizieren.
- Bestehende Installationen ohne Datenverlust auf das neue Speicherschema und die neuen Beispiellisten heben.

**Non-Goals:**

- Kein gemeinsamer Fortschrittsdatensatz für Vokabeln und Übungen.
- Kein Bearbeiten von Übungen in der App.

## Decisions

### Entscheidung 1: Übungen als Feld der Liste

`VocabList` erhält `exercises: Exercise[]`. `Exercise` ist eine diskriminierte Union:

- `{ kind: 'gap', key, parts, explanation? }`: `parts` ist eine Folge aus Text- und Lückenstücken.
- `{ kind: 'choice', key, question, options, answerIndex, explanation? }`

Beim Lesen gespeicherter Listen ergänzt die Speicherschicht ein fehlendes Feld als `[]`. Alte Datensätze bleiben dadurch gültig, ohne dass sie umgeschrieben werden müssen.

**Warum:** Ersetzen, Löschen und Anzeigen einer Liste wirken damit ohne Sonderpfade auch auf die Übungen.

**Alternative:** Eigener Store für Übungen. Verworfen, weil Import und Löschen dann zwei Speicherorte konsistent halten müssten.

### Entscheidung 2: JSON-Format mit Lückenmarkierung in geschweiften Klammern

```json
"exercises": [
  { "type": "gap", "sentence": "Yo {hablo} español.", "explanation": "1. Person Singular von hablar." },
  { "type": "choice", "question": "Nosotros ___ en Madrid.", "options": ["vivo", "vivimos", "viven"], "answer": "vivimos", "explanation": "nosotros → -imos" }
]
```

- **Lücken:** Sie werden direkt im Satz mit `{…}` markiert. Mehrere Lücken sind möglich. Leere oder unausgeglichene Klammern machen die Übung ungültig.
- **Antworten:** `answer` nennt den Text der richtigen Antwort und muss genau einer Option entsprechen. Beim Import wird daraus `answerIndex`.
- **Reihenfolge:** Die Optionen bleiben in der Dateireihenfolge, damit die Beschriftung A, B, C mit der Datei übereinstimmt.

**Warum:** Lücken im Satz selbst sind beim Pflegen der Datei lesbarer als getrennte Positionsangaben. Die Antwort als Text statt als Index vermeidet Verzählen.

**Alternativen:**

- *Lücken als Positionsliste:* fehleranfällig beim Bearbeiten.
- *Antwort als Index:* kompakter, aber unanschaulich.

### Entscheidung 3: Validierung im bestehenden Importpfad

`importFromJson` liest den optionalen Block `exercises`. Eine neue Funktion `validateExercises` in `validate.ts` prüft ihn nach dem Muster von `validateEntries`:

- Jede Übung wird einzeln geprüft.
- Fehler werden als `ImportIssue` mit Kennzeichnung „Übung N“ gemeldet.
- Duplikate werden über den Schlüssel erkannt.

`ImportOutcome` und die Import-Zusammenfassung erhalten die Anzahl importierter Übungen. Ob eine Liste angelegt wird, hängt weiterhin nur von den Einträgen ab: Eine Datei ohne gültige Einträge wird wie bisher abgelehnt. Der CSV-Import bleibt unverändert und liefert `exercises: []`.

### Entscheidung 4: Stabiler Übungsschlüssel ohne Erklärung

Der Schlüssel wird aus Typ und normalisiertem Inhalt abgeleitet, analog zu `deriveEntryKey`:

- **Lückentext:** der Satz einschließlich der Lückenwörter.
- **Auswahlfrage:** Frage und richtige Antwort.

Erklärung und falsche Antwortmöglichkeiten gehen nicht in den Schlüssel ein.

**Warum:** Die Spec verlangt, dass eine korrigierte Erklärung den Fortschritt nicht zurücksetzt. Dasselbe gilt sinnvollerweise für ausgetauschte Ablenker.

### Entscheidung 5: Eigener Store für Übungsfortschritt, IndexedDB Version 2

- **Neuer Store:** `exerciseProgress` mit dem Schlüssel `listId::exerciseKey` und dem Datensatz `{ listId, exerciseKey, solved, updatedAt }`.
- **Migration:** Das Upgrade von Version 1 auf 2 legt nur diesen Store an; bestehende Stores bleiben unberührt.
- **Schnittstelle:** `VocabStore` erhält `listExerciseProgress`, `saveExerciseProgress`, `putExerciseProgressBatch` und `clearExerciseProgress`. Memory- und Resilient-Store setzen sie gleichartig um.
- **Löschen:** `removeListCompletely` löscht beide Fortschrittsarten.
- **Ersetzen:** Der Fortschritt bleibt für alle Übungen erhalten, deren Schlüssel in der neuen Fassung noch vorkommt.

**Warum:** Für Übungen gibt es nur „gelöst“, keine Abfragerichtung. Ein getrennter Store hält beide Fortschrittsarten sauber auseinander und macht getrenntes Zurücksetzen trivial.

**Alternative:** Übungen als dritte „Richtung“ im bestehenden `progress`-Store. Verworfen, weil `Direction` und der Streak-Zähler dann Sonderfälle bekämen.

### Entscheidung 6: Wiederverwendung von Ziehlogik und Gesten

- **Ziehlogik:** `drawNext` wird generisch über Objekte mit `key`. Die Übungssitzung zieht damit aus den offenen Übungen und nimmt gelöste sofort heraus.
- **Lückentext:** Die Karte nutzt `useCardGestures` unverändert. Berühren zeigt die Lösung, Doppeltipp hält sie fest, Wischen bewertet.
- **Auswahlfrage:** Die Karte nutzt keine Wischgesten. Antworten sind Schaltflächen mit mindestens 44 px Höhe. Nach der ersten Wahl sind sie gesperrt, und „Weiter“ führt zur nächsten Übung.

**Warum:** Gleiches Verhalten bei Lückentexten und Vokabeln. Bei Auswahlfragen würde Wischen mit dem Antippen der Optionen kollidieren.

### Entscheidung 7: Aktualisierung der Beispiellisten über eine Versionsnummer

- **Versionsnummer:** Das bisherige Ja/Nein-Flag wird durch eine Versionsnummer `vokabeltrainer.samples-version` ersetzt.
- **Herkunft:** Listen aus Beispieldateien erhalten das Feld `sampleFile`.
- **Ablauf beim Start, wenn die gespeicherte Version kleiner als die aktuelle ist:**
  - Eine vorhandene Liste mit passendem `sampleFile` wird über denselben Pfad wie „Ersetzen“ aktualisiert. Vokabel- und Übungsfortschritt bleiben erhalten.
  - Bei einem echten Erststart (kein Flag, keine Listen) werden alle Beispiellisten angelegt.
  - Fehlt eine Beispielliste trotz früherer Einspielung, hat der Nutzer sie gelöscht. Sie wird nicht wieder angelegt.
- **Übergang von Version 1:** Alte Installationen haben das alte Flag, aber kein `sampleFile`. Einmalig gilt deshalb eine Liste ohne `sampleFile` mit exakt gleichem Namen wie eine Beispielliste als deren Vorgänger.

**Warum:** Nur so erhalten bestehende Nutzer die Übungen, ohne neu zu installieren und ohne Fortschritt zu verlieren.

### Entscheidung 8: Oberfläche

- **Listenübersicht:** Bei vorhandenen Übungen erscheint die dritte Kachel „Übungen“ mit „x gelöst · y offen“.
- **Zurücksetzen:** „Fortschritt zurücksetzen“ wird zu „Vokabeln zurücksetzen“. Daneben steht, nur bei vorhandenen Übungen, „Übungen zurücksetzen“, jeweils mit Bestätigungsdialog.
- **Navigation:** `App.tsx` erhält den Bildschirm `exercises`.
- **Zusammenfassung:** `SummaryView` wird mit Beschriftungen für „richtig/falsch/neu gelöst“ wiederverwendet.
- **Darstellung:** Alle Inhalte werden als Text gerendert.

## Risks / Trade-offs

- **Namensgleiche eigene Liste wird beim Übergang als Beispielliste aktualisiert** → Nur einmalig beim Wechsel vom alten Flag. Nur bei exakt gleichem Namen und fehlendem `sampleFile`. Der Fortschritt bleibt dabei erhalten.
- **IndexedDB-Upgrade blockiert, solange ein alter Tab offen ist** → Das bestehende Update-Verhalten lädt die App nach Bestätigung neu. Bei blockiertem Upgrade greift die vorhandene Fehlermeldung „Speicher nicht verfügbar“ des Resilient-Stores.
- **Der erste Tipp eines Doppeltipps lässt die Lösung kurz aufblitzen** → Wie bei den Vokabeln bewusst in Kauf genommen.
- **Übungen der Beispiellisten enthalten sprachliche Fehler** → Die Erklärungen bleiben kurz. Tests prüfen nur die Formalien; der Inhalt wird beim Erstellen gegengelesen.

## Migration Plan

1. **Speicher:** Die IndexedDB-Version wird auf 2 angehoben. Das Upgrade legt `exerciseProgress` an; vorhandene Daten bleiben unverändert.
2. **Beispiellisten:** Beim ersten Start der neuen Version werden sie gemäß Entscheidung 7 aktualisiert.
3. **Rollback:** Eine ältere App-Version kann Datenbank-Version 2 nicht öffnen. Ein Rollback erfordert daher ein erneutes Deployment mit Version ≥ 2. Listen und Vokabelfortschritt bleiben in jedem Fall in IndexedDB erhalten.
