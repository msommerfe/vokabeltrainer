# Tasks

## 1. Datenmodell und Übungsschlüssel

- [x] 1.1 Typen `Exercise` (Lückentext mit Text-/Lückenstücken, Auswahlfrage mit Optionen und `answerIndex`, jeweils optionale Erklärung) und `VocabList.exercises` ergänzen und verifizieren, dass `npx tsc --noEmit` fehlerfrei bleibt (Design, Entscheidung 1)
- [x] 1.2 Ableitung des Übungsschlüssels aus Typ und normalisiertem Inhalt ohne Erklärung und ohne falsche Optionen implementieren und per Unit-Test verifizieren, dass eine geänderte Erklärung oder ein ausgetauschter Ablenker denselben Schlüssel liefert, ein geänderter Satz bzw. eine geänderte richtige Antwort aber einen anderen (Design, Entscheidung 4)

## 2. JSON-Import von Übungen

- [x] 2.1 Parser für Lückentexte mit `{…}`-Markierung implementieren und per Unit-Test verifizieren, dass ein Satz mit zwei Lücken korrekt in Stücke zerlegt wird und Sätze ohne Lücke, mit leerer Lücke oder unausgeglichenen Klammern abgelehnt werden
- [x] 2.2 `validateExercises` nach dem Muster von `validateEntries` umsetzen und per Unit-Test verifizieren, dass Auswahlfragen mit weniger als zwei Optionen, mit nicht passender Antwort und Übungen unbekannten Typs mit Position „Übung N“ gemeldet werden und Duplikate erkannt werden (Spec `vocabulary-library`)
- [x] 2.3 `importFromJson` um den optionalen Block `exercises` erweitern und per Unit-Test verifizieren, dass eine Datei mit 10 Übungen, davon 2 fehlerhaft, alle Einträge und 8 Übungen liefert und eine Datei ohne Block `exercises: []` ergibt; CSV-Import liefert weiterhin `exercises: []`
- [x] 2.4 Import-Zusammenfassung um die Anzahl importierter Übungen ergänzen und per Komponententest verifizieren, dass „10 Übungen“ und gemeldete Übungsfehler angezeigt werden
- [x] 2.5 Übungsformat in `README.md` dokumentieren und verifizieren, dass das dort gezeigte Beispiel vom Importer ohne Meldungen gelesen wird (per Test)

## 3. Persistenz des Übungsfortschritts

- [x] 3.1 `VocabStore` um `listExerciseProgress`, `saveExerciseProgress`, `putExerciseProgressBatch` und `clearExerciseProgress` erweitern, im Memory- und Resilient-Store umsetzen und per Test verifizieren, dass Schreiben und Lesen denselben Datensatz liefert und ein fehlschlagender Speicher einen Hinweis meldet
- [x] 3.2 IndexedDB auf Version 2 heben, Store `exerciseProgress` beim Upgrade anlegen und verifizieren, dass eine vorhandene Version-1-Datenbank im Browser nach dem Upgrade Listen und Vokabelfortschritt unverändert enthält (Design, Entscheidung 5)
- [x] 3.3 Gespeicherte Listen ohne `exercises` beim Lesen mit `[]` ergänzen und per Test verifizieren, dass ein Altdatensatz ohne Feld fehlerfrei geladen wird
- [x] 3.4 `removeListCompletely` auf beide Fortschrittsarten erweitern und per Test verifizieren, dass nach dem Löschen weder Vokabel- noch Übungsfortschritt der Liste vorhanden ist
- [x] 3.5 Beim Ersetzen einer Liste den Übungsfortschritt über die Übungsschlüssel übernehmen und per Test verifizieren, dass gelöste Übungen gelöst bleiben, 5 neue Übungen offen sind und eine nur in der Erklärung geänderte Übung gelöst bleibt (Spec `learning-progress`)

## 4. Lernlogik und Zurücksetzen

- [x] 4.1 Bewertung einer Übung (richtig → gelöst, falsch → bleibt offen) als reine Funktion umsetzen und per Unit-Test verifizieren, dass eine falsche Antwort eine Übung nie als gelöst markiert
- [x] 4.2 Übersicht „gelöst/offen“ je Liste berechnen und per Unit-Test verifizieren, dass bei 12 Übungen mit 4 gelösten 4 und 8 ausgewiesen werden
- [x] 4.3 `drawNext` generisch für Objekte mit `key` machen und per Unit-Test verifizieren, dass die bestehenden Vokabeltests unverändert grün sind und Übungen ohne direkte Wiederholung gezogen werden
- [x] 4.4 `resetExercises` in `useLibrary` ergänzen und per Test verifizieren, dass danach keine Übung mehr gelöst ist und der Vokabelfortschritt unverändert bleibt; umgekehrt verifizieren, dass das Zurücksetzen der Vokabeln den Übungsfortschritt nicht verändert

## 5. Oberfläche

- [x] 5.1 Listenübersicht um die Kachel „Übungen“ (nur bei vorhandenen Übungen, mit „x gelöst · y offen“) und getrennte Aktionen „Vokabeln zurücksetzen“/„Übungen zurücksetzen“ mit Bestätigung erweitern und per Komponententest verifizieren, dass eine Liste ohne Übungen keine Kachel zeigt und Abbrechen nichts zurücksetzt
- [x] 5.2 Lückentext-Karte mit markierten Lücken umsetzen (Berühren zeigt Lösung und Erklärung, Loslassen verbirgt, Doppeltipp hält fest, Wischen bewertet) und per Komponententest verifizieren, dass beide Lücken nur während der Berührung bzw. nach Doppeltipp sichtbar sind
- [x] 5.3 Auswahlfrage-Karte mit A/B/C-Schaltflächen umsetzen und per Komponententest verifizieren, dass nach einer falschen Wahl die gewählte Antwort als falsch, die richtige als richtig gekennzeichnet und die Erklärung angezeigt wird, eine zweite Wahl nichts ändert und „Weiter“ erscheint
- [x] 5.4 Übungssitzung mit Zähler „offen“, „Beenden“, sofortigem Herausnehmen gelöster Übungen, Leerzustand mit Angebot zum Zurücksetzen und Zusammenfassung (richtig/falsch/neu gelöst) umsetzen und per Komponententest verifizieren, dass die Sitzung nach dem Lösen der letzten Übung endet
- [x] 5.5 Per Komponententest verifizieren, dass Markup in Satz, Frage, Optionen und Erklärung als Text erscheint und nicht interpretiert wird (Spec `exercise-session`)
- [x] 5.6 Übungsansicht im Browser bei 360 px Breite prüfen und verifizieren, dass lange Sätze, Optionen und Erklärungen umbrechen und kein horizontales Scrollen nötig ist

## 6. Beispieldaten und Aktualisierung bestehender Installationen

- [x] 6.1 Den drei Spanisch-Listen je mindestens 10 Lückentexte und 10 Auswahlfragen mit kurzer Erklärung hinzufügen und per Test verifizieren, dass jede Liste weiterhin 100 Einträge sowie ≥ 10 Übungen je Typ ohne Meldungen liefert und jede Übung eine Erklärung hat
- [x] 6.2 Versionsnummer `vokabeltrainer.samples-version` und Feld `sampleFile` einführen und per Test verifizieren, dass ein Erststart alle drei Listen anlegt und ein erneuter Start mit gleicher Version nichts verändert (Design, Entscheidung 7)
- [x] 6.3 Aktualisierung vorhandener Beispiellisten über den Ersetzen-Pfad umsetzen und per Test verifizieren, dass eine Liste mit Vokabelfortschritt nach dem Update die Übungen enthält und ihr Fortschritt unverändert ist
- [x] 6.4 Übergang vom alten Flag umsetzen und per Test verifizieren, dass eine gleichnamige Liste ohne `sampleFile` einmalig aktualisiert und eine vom Nutzer gelöschte Beispielliste nicht wieder angelegt wird
- [x] 6.5 Mitgelieferte Übungen und das Aktualisierungsverhalten in `README.md` beschreiben

## 7. Abschließende Integrationsprüfung

- [x] 7.1 Auf einem echten Handy eine bestehende Installation aktualisieren und verifizieren, dass die Übungen erscheinen, Lückentexte per Berühren aufgedeckt und per Wischen bewertet werden, Auswahlfragen per Antippen ausgewertet werden und Vokabelfortschritt erhalten bleibt
- [x] 7.2 `npm test`, `npm run build` und `openspec validate adds-exercises` ausführen und verifizieren, dass alles fehlerfrei durchläuft

## Workflow follow-up

- Change nach erfolgreicher Umsetzung archivieren (`openspec-archive-change`) und dabei die Delta-Specs in die Haupt-Specs übernehmen.
- Nach dem Push auf `main` prüfen, dass der GitHub-Pages-Workflow erfolgreich durchläuft.
