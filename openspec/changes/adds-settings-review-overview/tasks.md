# Tasks

## 1. Einstellungen

- [x] 1.1 `Settings`, `DEFAULT_SETTINGS` und `parseSettings` in `src/domain/settings.ts` anlegen und per Unit-Test verifizieren, dass fehlende, beschädigte und ungültige Werte (Schwelle 0 oder 11, Sitzungsgröße 0 oder keine Zahl) auf Standardwerte fallen und gültige Werte erhalten bleiben (Spec `app-settings`)
- [x] 1.2 Hook `useSettings` mit Speicherung unter `vokabeltrainer.settings` umsetzen und per Test verifizieren, dass eine geänderte Sitzungsgröße nach erneutem Einlesen erhalten bleibt und ein fehlschlagender `localStorage` die Standardwerte liefert, ohne zu werfen
- [x] 1.3 Bildschirm „Einstellungen“ mit getrennten Bereichen für Vokabeln und Übungen umsetzen und per Komponententest verifizieren, dass die Standardwerte angezeigt werden, ein geleertes Feld „alle“ bedeutet und eine Schwelle von 11 nicht übernommen wird

## 2. Schwelle und Lernstand

- [x] 2.1 `isLearned`, `openEntries` und `summarizeProgress` auf eine übergebene Schwelle umstellen (`streak >= threshold`) und per Unit-Test verifizieren, dass bei Schwelle 5 ein Wort mit Zähler 4 offen ist, bei gesenkter Schwelle ein Wort mit Zähler 2 sofort als gelernt gilt und bei erhöhter Schwelle wieder offen ist
- [x] 2.2 `ExerciseProgressRecord` um `streak` erweitern, `applyExerciseResult` zählen und bei „falsch“ auf 0 setzen lassen und `isSolved`/`openExercises`/`summarizeExercises` auf die Schwelle umstellen; per Unit-Test verifizieren, dass eine Übung bei Schwelle 2 erst nach zwei richtigen Antworten in Folge gelöst ist
- [x] 2.3 Alte Übungsdatensätze ohne `streak` beim Lesen umrechnen (`solved: true` → 1, sonst 0) und per Test verifizieren, dass eine früher gelöste Übung bei Schwelle 1 gelöst bleibt
- [x] 2.4 `useLibrary.rate` und `answerExercise` die Schwelle übergeben und per Unit-Test der zugrunde liegenden Funktionen verifizieren, dass „neu gelernt/gelöst“ genau beim Erreichen der eingestellten Schwelle gemeldet wird

## 3. Begrenzte Sitzung

- [x] 3.1 `pickSession(open, size, random)` umsetzen und per Unit-Test verifizieren, dass bei Größe 20 aus 100 offenen genau 20 verschiedene, bei 12 offenen alle 12 und bei „alle“ sämtliche Elemente gewählt werden und die Auswahl zwischen Aufrufen wechselt
- [x] 3.2 Vokabel- und Übungssitzung auf `pickSession` mit der jeweiligen Sitzungsgröße umstellen und per Komponententest verifizieren, dass bei Sitzungsgröße 1 die Sitzung nach dem Lernen dieses einen Wortes bzw. Lösen dieser einen Übung mit der Zusammenfassung endet

## 4. Zurückblättern in der Vokabelsitzung

- [x] 4.1 Verlauf bewerteter Karten und `ReviewCard` (aufgedeckt, mit Bewertung, ohne Gesten) umsetzen und per Komponententest verifizieren, dass „Zurück“ vor der ersten Bewertung fehlt, nach 12 Bewertungen zehnmal zurückgeblättert werden kann und die Karten in umgekehrter Reihenfolge mit Übersetzung und Bewertung erscheinen
- [x] 4.2 Per Komponententest verifizieren, dass Wischen auf einer zurückgeblätterten Karte keine Bewertung auslöst und „Weiter“ schrittweise zur aktuellen, verdeckten Karte zurückführt (Spec `flashcard-session`)

## 5. Kompaktübersicht und Navigation

- [x] 5.1 Bildschirm „Alle Vokabeln“ mit Tabelle (Sprache A, Sprache B, Markierung A→B und B→A) und Link je Liste umsetzen und per Komponententest verifizieren, dass alle Wortpaare ohne Beispiele erscheinen und ein nur in A→B gelerntes Wort nur dort markiert ist
- [x] 5.2 Knopf „Einstellungen“ in der Listenübersicht und die neuen Bildschirme in `App.tsx` einbinden, Einstellungen an Übersicht, Sitzungen und Kompaktübersicht durchreichen und im Browser verifizieren, dass eine geänderte Schwelle sofort in der Listenübersicht wirkt
- [x] 5.3 Einstellungen, Kompaktübersicht und Zurückblättern im Browser bei 360 px Breite prüfen und verifizieren, dass kein horizontales Scrollen nötig ist
- [x] 5.4 `README.md` um Einstellungen, Zurückblättern und Kompaktübersicht ergänzen

## 6. Abschließende Integrationsprüfung

- [ ] 6.1 Auf einem echten Handy verifizieren, dass Einstellungen nach einem Neustart erhalten bleiben, eine Sitzung mit Größe 10 genau 10 Wörter umfasst und das Zurückblättern per Antippen bedienbar ist
- [x] 6.2 `npm test`, `npm run build` und `openspec validate adds-settings-review-overview` ausführen und verifizieren, dass alles fehlerfrei durchläuft

## Workflow follow-up

- Change nach erfolgreicher Umsetzung archivieren und dabei die Delta-Specs in die Haupt-Specs übernehmen.
- Nach dem Push auf `main` prüfen, dass der GitHub-Pages-Workflow erfolgreich durchläuft.
