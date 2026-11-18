# Spec Delta

## Purpose

Beschreibt den Ablauf einer Karteikarten-Lernsitzung: Auswahl der Liste und Abfragerichtung, Anzeige der Karte, Aufdecken der Übersetzung, Bewertung per Swipe und Abschluss der Sitzung.

## ADDED Requirements

### Requirement: Sitzung starten

Vor dem Start einer Sitzung MUSS der Nutzer eine Vokabelliste und eine Abfragerichtung wählen. Die Sitzung MUSS alle Wörter umfassen, die in der gewählten Richtung noch nicht als gelernt gelten, und nur diese.

#### Scenario: Sitzung mit offenen Wörtern

- **WHEN** der Nutzer eine Liste mit 30 noch nicht gelernten Wörtern auswählt und die Sitzung startet
- **THEN** wird die erste Karte angezeigt
- **AND** die Anzahl der noch offenen Wörter ist sichtbar

#### Scenario: Alle Wörter bereits gelernt

- **WHEN** der Nutzer eine Liste auswählt, in der alle Wörter in dieser Richtung als gelernt gelten
- **THEN** wird keine Karte angezeigt
- **AND** das System meldet, dass die Liste in dieser Richtung abgeschlossen ist
- **AND** bietet an, den Fortschritt dieser Liste zurückzusetzen

### Requirement: Abfragerichtung

Das System MUSS die Abfrage in beide Richtungen unterstützen: Sprache A → Sprache B und Sprache B → Sprache A. Die gewählte Richtung bestimmt, welches Wort auf der Vorderseite steht.

#### Scenario: Richtung A nach B

- **WHEN** die Richtung A→B gewählt ist
- **THEN** zeigt die Vorderseite jeder Karte das Wort in Sprache A
- **AND** die aufgedeckte Rückseite zeigt das Wort in Sprache B

#### Scenario: Richtung B nach A

- **WHEN** die Richtung B→A gewählt ist
- **THEN** zeigt die Vorderseite jeder Karte das Wort in Sprache B
- **AND** die aufgedeckte Rückseite zeigt das Wort in Sprache A

#### Scenario: Richtung wechseln

- **WHEN** der Nutzer für dieselbe Liste die Abfragerichtung wechselt
- **THEN** wird der Fortschritt der anderen Richtung unabhängig geführt und nicht überschrieben

### Requirement: Übersetzung aufdecken

Die Übersetzung MUSS sichtbar sein, solange der Nutzer die Karte berührt, und beim Loslassen wieder verborgen werden. Ein Doppeltipp MUSS die Übersetzung dauerhaft aufdecken, bis die nächste Karte erscheint. Beim Aufdecken MÜSSEN die Übersetzung und alle hinterlegten Beispiele sichtbar werden.

#### Scenario: Anzeigen bei Berührung

- **WHEN** der Nutzer die Karte berührt
- **THEN** wird die Übersetzung sofort angezeigt, ohne Mindestdauer

#### Scenario: Verbergen beim Loslassen

- **WHEN** der Nutzer die Karte loslässt, ohne zuvor doppelt getippt zu haben
- **THEN** wird die Übersetzung wieder verborgen

#### Scenario: Dauerhaft per Doppeltipp

- **WHEN** der Nutzer die Karte zweimal kurz hintereinander antippt
- **THEN** bleibt die Übersetzung nach dem Loslassen sichtbar
- **AND** sie bleibt sichtbar, bis die nächste Karte erscheint

#### Scenario: Sichtbar beim Wischen

- **WHEN** der Nutzer die Karte berührt und wischt
- **THEN** bleibt die Übersetzung während der Wischbewegung sichtbar

#### Scenario: Beispiele werden mit angezeigt

- **WHEN** die Übersetzung eines Wortes mit hinterlegten Beispielen aufgedeckt wird
- **THEN** werden alle Beispiele in beiden Sprachen unter der Übersetzung angezeigt

### Requirement: Bewertung per Swipe

Der Nutzer MUSS eine Karte durch Wischen bewerten: Wischen nach rechts bedeutet "gewusst", Wischen nach links bedeutet "nicht gewusst". Nach der Bewertung MUSS die nächste Karte verdeckt erscheinen.

#### Scenario: Wischen nach rechts

- **WHEN** der Nutzer die Karte nach rechts wischt
- **THEN** wird die Antwort als "gewusst" gewertet
- **AND** die nächste Karte wird mit verdeckter Übersetzung angezeigt

#### Scenario: Wischen nach links

- **WHEN** der Nutzer die Karte nach links wischt
- **THEN** wird die Antwort als "nicht gewusst" gewertet
- **AND** die nächste Karte wird mit verdeckter Übersetzung angezeigt

#### Scenario: Abgebrochene Wischgeste

- **WHEN** der Nutzer die Karte anzieht, aber vor Erreichen der Auslöseschwelle loslässt
- **THEN** kehrt die Karte in ihre Ausgangslage zurück
- **AND** es wird keine Bewertung gespeichert

### Requirement: Kartenauswahl während der Sitzung

Jede nächste Karte MUSS zufällig aus den aktuell offenen Wörtern gezogen werden. Ein Wort DARF erneut vorgelegt werden, bevor alle anderen offenen Wörter einmal abgefragt wurden. Dasselbe Wort SOLL NICHT zweimal direkt hintereinander erscheinen, solange mehr als ein Wort offen ist. Ein Wort, das während der Sitzung als gelernt gilt, MUSS sofort aus der Auswahl entfernt werden.

#### Scenario: Keine Begrenzung der Kartenzahl

- **WHEN** der Nutzer eine Sitzung für eine Liste mit 100 offenen Wörtern startet
- **THEN** kann jedes der 100 Wörter gezogen werden
- **AND** es gibt keine Obergrenze von 20 Karten

#### Scenario: Wiederholung vor vollständigem Durchlauf

- **WHEN** in einer Sitzung mit 100 offenen Wörtern bereits einige Wörter abgefragt wurden
- **THEN** darf ein bereits abgefragtes Wort erneut erscheinen, auch wenn andere Wörter noch nicht abgefragt wurden

#### Scenario: Keine direkte Wiederholung

- **WHEN** mehr als ein Wort offen ist und eine Karte bewertet wurde
- **THEN** zeigt die nächste Karte ein anderes Wort

#### Scenario: Nur ein Wort offen

- **WHEN** nur noch ein Wort offen ist
- **THEN** darf dieses Wort direkt hintereinander erscheinen

#### Scenario: Gelernt während der Sitzung

- **WHEN** ein Wort während der Sitzung zum dritten Mal in Folge als "gewusst" bewertet wird
- **THEN** erscheint es in dieser Sitzung nicht mehr

### Requirement: Sitzung abschließen

Eine Sitzung MUSS enden, wenn alle Wörter der gewählten Richtung als gelernt gelten oder der Nutzer sie beendet. Der Nutzer MUSS die Sitzung jederzeit beenden können. Zum Abschluss MUSS eine Zusammenfassung mit der Anzahl gewusster und nicht gewusster Antworten sowie der in dieser Sitzung neu gelernten Wörter angezeigt werden.

#### Scenario: Letztes Wort gelernt

- **WHEN** das letzte offene Wort der Sitzung als gelernt gilt
- **THEN** wird die Sitzungszusammenfassung angezeigt

#### Scenario: Sitzung beenden

- **WHEN** der Nutzer auf "Beenden" tippt
- **THEN** wird die Sitzungszusammenfassung angezeigt

#### Scenario: Sitzung vorzeitig verlassen

- **WHEN** der Nutzer die Sitzung beendet oder die App schließt
- **THEN** bleiben alle bis dahin gespeicherten Bewertungen erhalten

#### Scenario: Serie nach Abbruch fortsetzen

- **WHEN** der Nutzer 7 Wörter je einmal als "gewusst" bewertet, die Sitzung beendet und später eine neue Sitzung startet
- **THEN** steht der Zähler dieser 7 Wörter auf 1 und wird in der neuen Sitzung weitergezählt
- **AND** alle nicht bewerteten Wörter stehen weiterhin auf 0
