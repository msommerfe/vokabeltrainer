# Tasks

## 1. Projektgerüst

- [x] 1.1 Vite-Projekt mit React und TypeScript im Repository-Root anlegen und verifizieren, dass `npm run dev` die Startseite im Browser ausliefert
- [x] 1.2 Abhängigkeiten ergänzen (`idb`, `papaparse` inkl. Typen, `vite-plugin-pwa`, `vitest`) und verifizieren, dass `npm install` fehlerfrei durchläuft
- [x] 1.3 TypeScript im strict-Modus konfigurieren und verifizieren, dass `npx tsc --noEmit` ohne Fehler endet
- [x] 1.4 Vitest einrichten und verifizieren, dass `npm test` mit einem Platzhaltertest grün läuft

## 2. Datenmodell und Wort-Identität

- [x] 2.1 Typen für Vokabeleintrag (Wort A, Wort B, Beispiele) und Vokabelliste (Name, Sprachbezeichnungen, Einträge) definieren und verifizieren, dass `npx tsc --noEmit` fehlerfrei bleibt
- [x] 2.2 Ableitung des normalisierten Wort-Schlüssels aus Wort A und Wort B implementieren (Design, Entscheidung 4) und per Unit-Test verifizieren, dass derselbe Schlüssel bei geänderter Reihenfolge der Einträge, geänderter Groß-/Kleinschreibung und ergänzten Beispielen stabil bleibt
- [x] 2.3 Typ für Abfragerichtung (A→B, B→A) einführen und per Unit-Test verifizieren, dass der Fortschrittsschlüssel aus Wort-Schlüssel und Richtung für beide Richtungen verschieden ist

## 3. Import von Wortlisten

- [x] 3.1 Gemeinsame Validierung je Eintrag implementieren, die gültige Einträge und fehlerhafte Positionen getrennt zurückgibt, und per Unit-Test verifizieren, dass ein Eintrag ohne Wort A oder ohne Wort B abgelehnt wird (Spec `vocabulary-library`)
- [x] 3.2 JSON-Importer implementieren und per Unit-Test verifizieren, dass eine gültige Datei alle Einträge liefert und eine syntaktisch kaputte Datei keinen Eintrag importiert, sondern einen Fehler meldet
- [x] 3.3 CSV-Importer mit PapaParse implementieren (Kopfzeile, Beispiele in Spaltenpaaren) und per Unit-Test verifizieren, dass Felder mit Kommas in Anführungszeichen korrekt gelesen werden
- [x] 3.4 Teilimport bei CSV umsetzen und per Unit-Test verifizieren, dass bei 50 Zeilen mit 3 unvollständigen genau 47 Einträge entstehen und die 3 Zeilennummern gemeldet werden
- [x] 3.5 Totalablehnung umsetzen und per Unit-Test verifizieren, dass eine Datei ohne einzige gültige Zeile keine Liste anlegt
- [x] 3.6 Fehlende Sprachbezeichnungen auf "Sprache A"/"Sprache B" zurückfallen lassen und per Unit-Test verifizieren, dass der Import dadurch nicht abgelehnt wird
- [x] 3.7 Duplikaterkennung über den Wort-Schlüssel innerhalb einer Liste ergänzen (Design, Risiko Homonyme) und per Unit-Test verifizieren, dass der zweite Eintrag mit gleichem Schlüssel als Duplikat gemeldet wird
- [x] 3.8 Beispiel-Wortliste je einmal als JSON und als CSV im Repository ablegen, deren Format in `README.md` dokumentieren und per Test verifizieren, dass beide Dateien vom jeweiligen Importer fehlerfrei gelesen werden

## 4. Persistenz

- [x] 4.1 IndexedDB-Zugriffsschicht mit getrennten Stores für Listen und Fortschritt anlegen (Design, Entscheidung 3) und per Test gegen eine In-Memory-Implementierung verifizieren, dass Schreiben und Lesen denselben Datensatz liefert
- [x] 4.2 Speichern und Laden importierter Listen umsetzen und im Browser verifizieren, dass eine importierte Liste nach dem Neuladen der Seite weiterhin in der Übersicht erscheint (Spec `vocabulary-library`)
- [x] 4.3 Löschen einer Liste samt zugehörigem Fortschritt umsetzen und per Test verifizieren, dass nach dem Löschen weder Liste noch deren Fortschrittseinträge vorhanden sind
- [x] 4.4 Fehlerbehandlung bei nicht verfügbarem oder vollem Speicher ergänzen und per Test mit einem fehlschlagenden Storage verifizieren, dass ein Hinweis gemeldet wird und der Aufruf die Sitzung nicht abbricht (Spec `learning-progress`)

## 5. Lernlogik

- [x] 5.1 Streak-Zähler je Wort und Richtung implementieren und per Unit-Test verifizieren, dass "gewusst" von 1 auf 2 erhöht und "nicht gewusst" auf 0 zurücksetzt (Spec `learning-progress`)
- [x] 5.2 Gelernt-Kriterium bei 3 Treffern in Folge implementieren und per Unit-Test verifizieren, dass das Wort ab der dritten korrekten Antwort in Folge als gelernt gilt
- [x] 5.3 Trennung des Fortschritts je Richtung sicherstellen und per Unit-Test verifizieren, dass ein in A→B gelerntes Wort in B→A weiterhin offen ist
- [x] 5.4 Zusammenstellung eines Durchgangs implementieren (nur offene Wörter, gemischt, kein Wiedervorlegen im selben Durchgang — Design, Entscheidung 10) und per Unit-Test verifizieren, dass gelernte Wörter fehlen und jedes offene Wort genau einmal vorkommt — abgelöst durch Abschnitt 11
- [x] 5.5 Fortschrittsübersicht je Liste und Richtung berechnen und per Unit-Test verifizieren, dass bei 100 Wörtern mit 40 gelernten 40 gelernte und 60 offene ausgewiesen werden
- [x] 5.6 Zurücksetzen des Fortschritts einer Liste implementieren und per Unit-Test verifizieren, dass danach alle Zähler auf 0 stehen und kein Wort als gelernt gilt
- [x] 5.7 Fortschrittserhalt bei erneutem Import umsetzen und per Unit-Test verifizieren, dass bei einer um 10 Wörter erweiterten Liste der bestehende Fortschritt erhalten bleibt und die neuen Wörter bei 0 starten

## 6. Gestensteuerung

- [x] 6.1 Pointer-Event-Handler für Wischen mit Distanzschwelle und benannten Konstanten implementieren (Design, Entscheidung 8) und per Unit-Test mit simulierten Pointer-Events verifizieren, dass rechts "gewusst" und links "nicht gewusst" auslöst (Spec `flashcard-session`)
- [x] 6.2 Rücksprung bei abgebrochener Wischgeste umsetzen und per Unit-Test verifizieren, dass unterhalb der Auslöseschwelle keine Bewertung entsteht
- [x] 6.3 Langen Druck ab 500 ms zum Aufdecken implementieren und per Unit-Test verifizieren, dass das Aufdecken auslöst und bei Überschreiten der Wischschwelle der Timer verworfen wird — abgelöst durch Abschnitt 11
- [x] 6.4 Doppeltipp zum Aufdecken implementieren und per Unit-Test verifizieren, dass zwei Tipps ohne nennenswerte Bewegung aufdecken, ein einzelner Tipp jedoch nicht
- [ ] 6.5 Kontextmenü und Textauswahl auf der Karte unterbinden und auf einem echten Handy (iOS Safari und Android Chrome) verifizieren, dass langer Druck kein Systemmenü öffnet

## 7. Oberfläche

- [x] 7.1 Listenübersicht mit Auswahl, Fortschrittsanzeige, Löschen und Zurücksetzen (inkl. Bestätigungsdialog) umsetzen und im Browser verifizieren, dass Abbrechen der Bestätigung den Fortschritt unverändert lässt
- [x] 7.2 Import-Ansicht für JSON- und CSV-Dateiauswahl umsetzen, die Anzahl importierter Einträge und übersprungene Zeilen anzeigt, und im Browser mit der Beispieldatei verifizieren
- [x] 7.3 Konfliktabfrage bei gleichnamiger Liste (ersetzen oder zusätzlich anlegen) umsetzen und im Browser verifizieren, dass beide Wege zum erwarteten Ergebnis führen (Spec `vocabulary-library`)
- [x] 7.4 Auswahl der Abfragerichtung vor dem Sitzungsstart umsetzen und im Browser verifizieren, dass die Vorderseite der Karte die gewählte Ausgangssprache zeigt
- [x] 7.5 Kartenansicht mit verdeckter Rückseite, Wischanimation und Anzeige aller Beispiele beim Aufdecken umsetzen und im Browser verifizieren, dass ein einzelner Tipp nicht aufdeckt — abgelöst durch Abschnitt 11
- [x] 7.6 Leerzustand "alle Wörter dieser Richtung gelernt" mit Angebot zum Zurücksetzen umsetzen und im Browser verifizieren (Spec `flashcard-session`)
- [x] 7.7 Sitzungszusammenfassung mit gewussten, nicht gewussten und neu gelernten Wörtern umsetzen und im Browser verifizieren, dass sie nach der letzten Karte erscheint — abgelöst durch Abschnitt 11
- [x] 7.8 Importierte Inhalte ausschließlich als Text rendern (Design, Entscheidung 7) und per Test verifizieren, dass ein Eintrag mit HTML-Markup unverändert als Text erscheint und nicht interpretiert wird
- [x] 7.9 Layout für Hochformat umsetzen und bei 360 Pixel Breite verifizieren, dass kein horizontales Scrollen nötig ist und lange Beispielsätze umbrechen statt abgeschnitten zu werden (Spec `offline-app-shell`)

## 8. PWA

- [ ] 8.1 `vite-plugin-pwa` mit Manifest, App-Name und Icons konfigurieren und auf dem Handy verifizieren, dass die App zum Homescreen hinzugefügt und ohne Adressleiste gestartet werden kann (Spec `offline-app-shell`)
- [x] 8.2 Precaching der App-Shell aktivieren und im Flugmodus verifizieren, dass die App startet, eine Sitzung durchlaufen werden kann und der Fortschritt gespeichert wird
- [x] 8.3 Import einer lokalen Datei ohne Netzverbindung verifizieren (Spec `offline-app-shell`)
- [x] 8.4 Update-Verhalten mit Hinweis auf eine neue Version umsetzen und durch zweimaliges Deployment verifizieren, dass die neue Version greift und Listen samt Fortschritt erhalten bleiben
- [x] 8.5 Build- und Deployment-Schritte in `README.md` dokumentieren und verifizieren, dass die dokumentierten Befehle wie beschrieben durchlaufen

## 9. Abschließende Integrationsprüfung

- [ ] 9.1 Durchgang von Import über eine vollständige Lernsitzung bis zur Zusammenfassung auf einem echten Handy durchspielen und verifizieren, dass ein Wort nach dreimal "gewusst" in Folge in der laufenden und in folgenden Sitzungen nicht mehr erscheint
- [x] 9.2 `npm test` und `npx tsc --noEmit` ausführen und verifizieren, dass beide fehlerfrei durchlaufen
- [x] 9.3 `openspec validate vokabeltrainer-mvp` ausführen und verifizieren, dass der Change gültig ist (die RFC-2119-Warnungen sind erwartet, weil die Specs auf Deutsch verfasst sind)

## 10. Durchgangsgröße und Startdatensatz

- [x] 10.1 Durchgang auf 20 zufällige offene Wörter begrenzen und per Unit-Test verifizieren, dass eine Liste mit 100 offenen Wörtern genau 20 Karten liefert, eine mit 12 Wörtern alle 12, und die Auswahl zwischen Durchgängen wechselt (Spec `flashcard-session`) — abgelöst durch Abschnitt 11
- [x] 10.2 Speicherung je Bewertung absichern und per Unit-Test verifizieren, dass nach 7 von 20 bewerteten Karten genau 7 Fortschrittseinträge vorliegen und die übrigen auf 0 bleiben (Spec `learning-progress`)
- [x] 10.3 Drei Spanisch-Deutsch-Listen mit je 100 Einträgen anlegen (Grundwortschatz, Alltagswörter, Aufbauwortschatz), jeder Eintrag mit einfachem Beispiel und Verben zusätzlich mit Präsenskonjugation, und per Test verifizieren, dass jede Liste genau 100 fehlerfreie Einträge liefert (Spec `vocabulary-library`)
- [x] 10.4 Mitgelieferte Englisch-Beispiellisten durch die Spanisch-Listen ersetzen und im Browser verifizieren, dass beim ersten Start genau drei Listen mit je zwei Richtungen erscheinen
- [x] 10.5 Begrenzung und Startdatensatz in `README.md` dokumentieren und im Browser verifizieren, dass ein Durchgang einer 100-Wörter-Liste 20 Karten umfasst und ein Abbruch nach einigen Karten den Fortschritt behält — abgelöst durch Abschnitt 11

## 11. Aufdecken per Berührung und durchgehende Sitzung

- [x] 11.1 Gestenlogik so umbauen, dass eine Berührung sofort aufdeckt und Loslassen oder Abbruch wieder verbirgt, den Lange-Druck-Timer entfernen und per Unit-Test verifizieren, dass ohne Wartezeit aufgedeckt und beim Loslassen wieder verborgen wird (Spec `flashcard-session`)
- [x] 11.2 Doppeltipp fixiert die Anzeige bis zur nächsten Karte; per Unit-Test verifizieren, dass die Übersetzung nach Doppeltipp und Loslassen sichtbar bleibt und die nächste Karte verdeckt erscheint
- [x] 11.3 Per Unit-Test verifizieren, dass die Übersetzung während einer Wischbewegung sichtbar bleibt und die Bewertung trotzdem auslöst
- [ ] 11.4 Kartenansicht anpassen und im Browser verifizieren, dass Berühren die Übersetzung zeigt, Loslassen sie verbirgt und ein Doppeltipp sie fixiert
- [x] 11.5 `MAX_ROUND_SIZE` entfernen, Ziehen aus allen offenen Wörtern umsetzen und per Unit-Test verifizieren, dass bei 100 offenen Wörtern jedes Wort gezogen werden kann
- [x] 11.6 Wiederholung vor vollständigem Durchlauf erlauben, aber keine direkte Wiederholung bei mehr als einem offenen Wort, und mit festem Zufallsgenerator per Unit-Test verifizieren
- [x] 11.7 Gelernte Wörter sofort aus der laufenden Sitzung nehmen und per Unit-Test verifizieren, dass ein Wort nach dem dritten Treffer in Folge nicht mehr gezogen wird (Spec `learning-progress`)
- [ ] 11.8 Schaltfläche "Beenden" ergänzen, die Sitzung automatisch beenden, wenn alle Wörter gelernt sind, die Fortschrittsanzeige auf offene Wörter umstellen und im Browser verifizieren, dass in beiden Fällen die Zusammenfassung erscheint
- [x] 11.9 `README.md` anpassen: Gesten beschreiben und den Hinweis auf 20 Karten pro Durchgang ersetzen
- [x] 11.10 `npm test`, `npm run build` und `openspec validate vokabeltrainer-mvp` ausführen und verifizieren, dass alles fehlerfrei durchläuft

## Workflow follow-up

- Change nach erfolgreicher Umsetzung archivieren (`openspec-archive-change`).
- Archiviertes Ergebnis prüfen: Specs liegen unter `openspec/specs/`, der Change unter `openspec/changes/archive/`.
