# Design

## Context

Motivation und Umfang: siehe `proposal.md`. Anforderungen: siehe `specs/`.

Ausgangslage im Code:

- **Vokabelschwelle:** Sie steckt als Konstante `LEARNED_THRESHOLD = 3` in `src/domain/types.ts`. `applyRating` speichert `learned` im Fortschrittsdatensatz, und `isLearned` liest dieses Feld.
- **Übungsfortschritt:** Er kennt nur `solved: boolean` (`src/domain/exercises.ts`).
- **Sitzungen:** `SessionView` und `ExerciseSessionView` legen beim Start die offenen Elemente fest (`openEntries`/`openExercises`) und ziehen daraus mit `drawNext`.
- **Navigation:** `App.tsx` steuert sie über einen `Screen`-Zustand; Einstellungen gibt es bisher nicht.
- **localStorage:** Er wird bereits für die Version der Beispiellisten genutzt (`useLibrary.ts`).

## Goals / Non-Goals

**Goals:**

- Die Schwelle wirkt sofort und rückwirkend, ohne gespeicherte Datensätze umzuschreiben.
- Bestehende Daten bleiben ohne Datenbank-Migration gültig.
- Einstellungen sind ohne Speicher (privater Modus) mit Standardwerten nutzbar.

**Non-Goals:**

- Kein Synchronisieren von Einstellungen zwischen Geräten.
- Kein Rückgängigmachen von Bewertungen.

## Decisions

### Entscheidung 1: Gelernt- bzw. Gelöst-Status aus Zähler und Schwelle berechnen

`isLearned` und `isSolved` erhalten die Schwelle als Parameter und prüfen `streak >= threshold`. Das gespeicherte Feld `learned` wird nicht mehr gelesen. `applyRating` schreibt es zur Abwärtskompatibilität weiterhin, mit der dann gültigen Schwelle.

**Warum:** Die Spec verlangt, dass eine geänderte Schwelle sofort für den vorhandenen Fortschritt gilt, in beide Richtungen. Eine Berechnung beim Lesen erfüllt das ohne Umschreiben gespeicherter Daten. Gelernte Wörter werden nicht mehr abgefragt, ihr Zähler bleibt also genau auf der Schwelle stehen, bei der sie gelernt wurden. Ein Erhöhen der Schwelle macht sie damit wie gewünscht wieder offen.

**Alternative:** Bei jeder Schwellenänderung alle Datensätze neu bewerten. Verworfen, weil das bei vielen Listen langsam ist und bei Speicherfehlern inkonsistente Zustände hinterlassen kann.

### Entscheidung 2: Übungsfortschritt mit Zähler, alte Datensätze beim Lesen umrechnen

`ExerciseProgressRecord` bekommt das Feld `streak`. `applyExerciseResult` erhöht ihn bei „richtig“ und setzt ihn bei „falsch“ auf 0. `solved` wird nicht mehr gelesen.

Alte Datensätze ohne `streak` normalisiert die Speicherschicht beim Lesen, analog zu `normalizeStoredList`:

| Alter Datensatz | Neuer Zähler |
| --- | --- |
| `solved: true` | `streak = 1` |
| `solved: false` | `streak = 0` |

**Warum:** Mit dem Standardwert 1 bleiben bisher gelöste Übungen gelöst; das verlangt die Spec. Eine Datenbank-Migration (Versionssprung) ist nicht nötig.

### Entscheidung 3: Einstellungen in localStorage, bereitgestellt über einen Hook

- **Typ und Funktionen:** `Settings` (`{ vocab: { sessionSize, threshold }, exercises: { sessionSize, threshold } }`), `DEFAULT_SETTINGS` und `parseSettings` (prüft und ergänzt fehlende oder ungültige Felder mit Standardwerten) liegen in `src/domain/settings.ts`.
- **Werte:** `sessionSize: number | null`, wobei `null` für „alle“ steht. `threshold` ist eine ganze Zahl von 1 bis 10.
- **Hook:** `useSettings` in `src/app/` liest den Schlüssel `vokabeltrainer.settings` beim Start, schreibt jede gültige Änderung sofort und fällt bei Lese- oder Schreibfehlern auf Standardwerte bzw. den Stand im Arbeitsspeicher zurück.

**Warum:** Es sind wenige, kleine, synchrone Werte, die beim Rendern sofort verfügbar sein müssen. IndexedDB wäre asynchron und bräuchte einen Versionssprung.

**Alternative:** IndexedDB-Store `settings`. Verworfen wegen Aufwand ohne Nutzen.

### Entscheidung 4: Begrenzte Sitzung über eine Auswahl beim Start

Eine neue reine Funktion `pickSession(open, size, random)` liefert bei `size === null` oder `open.length <= size` alle offenen Elemente, sonst `size` zufällig gewählte (teilweises Fisher-Yates). Beide Sitzungsansichten legen damit beim Start ihre Menge fest. Das weitere Ziehen mit `drawNext` und das Herausnehmen gelernter Elemente bleiben unverändert.

### Entscheidung 5: Zurückblättern als Verlauf in der Vokabelsitzung

- **Verlauf:** `SessionView` führt einen Verlauf aus `{ entry, rating }` aller in der Sitzung bewerteten Karten. Er ist unbegrenzt, denn eine Sitzung bleibt klein genug.
- **Position:** Ein Index `reviewing: number | null` bestimmt, welche Verlaufskarte angezeigt wird.
- **Anzeige:** Eine eigene Komponente `ReviewCard` zeigt die Karte aufgedeckt mit Bewertungskennzeichnung und ohne Gestensteuerung. Ein erneutes Bewerten ist damit technisch ausgeschlossen.
- **Bedienung:** „Zurück“ verringert den Index, „Weiter“ erhöht ihn. Am Ende des Verlaufs wird `reviewing` zu `null`, und die aktuelle Karte erscheint wieder verdeckt (neuer `key`).

**Warum:** Eine Karte ohne Gesten-Handler erfüllt „keine erneute Bewertung“ strukturell, statt Gesten bedingt abschalten zu müssen.

**Alternative:** `Card` mit Schalter `readOnly`. Verworfen, weil `Card` dann zwei Verhaltensweisen mischt.

### Entscheidung 6: Bildschirme für Einstellungen und Kompaktübersicht

- **Navigation:** `App.tsx` erhält die Bildschirme `settings` und `overview` (mit `listId`).
- **Einstiege:** Die Listenübersicht bekommt im Kopf den Knopf „Einstellungen“ und je Liste den Link „Alle Vokabeln“.
- **Kompaktübersicht:** Sie ist eine Tabelle mit den Spalten Sprache A, Sprache B, „A→B“ und „B→A“. Die Gelernt-Markierungen ✓ werden über `isLearned` mit der aktuellen Schwelle berechnet.
- **Einstellungsfelder:** Die Sitzungsgröße ist ein Zahlenfeld, leer bedeutet „alle“. Die Schwelle ist ein Zahlenfeld mit `min=1` und `max=10`. Ungültige Eingaben werden nicht übernommen, das Feld zeigt dann wieder den gültigen Wert.

### Entscheidung 7: Schwelle an alle Stellen durchreichen

`useLibrary.rate` und `answerExercise` erhalten die Schwelle, damit „neu gelernt/gelöst“ korrekt bestimmt wird. Das betrifft auch Listenübersicht, Sitzungen und Kompaktübersicht, die die Einstellungen aus `App.tsx` als Props erhalten.

## Risks / Trade-offs

- **Gesenkte Schwelle macht viele Wörter auf einmal „gelernt“** → Gewolltes Verhalten (Spec). In der Listenübersicht ist die Wirkung sofort sichtbar.
- **Schwelle während einer laufenden Sitzung geändert** → Nicht möglich, weil die Einstellungen nur aus der Listenübersicht erreichbar sind.
- **Große Listen in der Kompaktübersicht** → Eine einfache Tabelle ohne Bilder; Hunderte Zeilen sind unkritisch.

## Migration Plan

Keine Datenbank-Migration:

- Alte Übungsdatensätze werden beim Lesen umgerechnet (Entscheidung 2).
- Das Feld `learned` bei Vokabeln bleibt erhalten, wird aber nicht mehr gelesen.
- Ohne gespeicherte Einstellungen gelten die Standardwerte. Diese entsprechen dem bisherigen Verhalten.
