# Spec Delta

## Purpose

Beschreibt den Ablauf einer Karteikarten-Lernsitzung: Auswahl der Liste und Abfragerichtung, Anzeige der Karte, Aufdecken der Übersetzung, Bewertung per Swipe und Abschluss der Sitzung.

## ADDED Requirements

### Requirement: Sitzung starten

Vor dem Start einer Sitzung MUSS der Nutzer eine Vokabelliste und eine Abfragerichtung wählen. Die Sitzung MUSS nur Wörter enthalten, die in der gewählten Richtung noch nicht als gelernt gelten.

#### Scenario: Sitzung mit offenen Wörtern

- **WHEN** der Nutzer eine Liste mit 30 noch nicht gelernten Wörtern auswählt und die Sitzung startet
- **THEN** wird die erste Karte angezeigt
- **AND** der Fortschritt innerhalb der Sitzung ist sichtbar

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

Die Übersetzung MUSS verdeckt bleiben, bis der Nutzer die Karte lange drückt oder doppelt antippt. Beim Aufdecken MÜSSEN die Übersetzung und alle hinterlegten Beispiele sichtbar werden.

#### Scenario: Aufdecken per langem Druck

- **WHEN** der Nutzer die Karte mindestens 500 Millisekunden gedrückt hält
- **THEN** wird die Übersetzung angezeigt

#### Scenario: Aufdecken per Doppeltipp

- **WHEN** der Nutzer die Karte zweimal kurz hintereinander antippt
- **THEN** wird die Übersetzung angezeigt

#### Scenario: Beispiele werden mit angezeigt

- **WHEN** die Übersetzung eines Wortes mit hinterlegten Beispielen aufgedeckt wird
- **THEN** werden alle Beispiele in beiden Sprachen unter der Übersetzung angezeigt

#### Scenario: Einzelnes Tippen deckt nicht auf

- **WHEN** der Nutzer die Karte nur einmal kurz antippt
- **THEN** bleibt die Übersetzung verdeckt

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

#### Scenario: Bewertung ohne Aufdecken

- **WHEN** der Nutzer eine Karte wischt, ohne die Übersetzung aufgedeckt zu haben
- **THEN** wird die Bewertung trotzdem gewertet

### Requirement: Umfang eines Durchgangs

Ein Durchgang MUSS auf höchstens 20 Karten begrenzt sein. Enthält die Liste mehr offene Wörter, MUSS das System daraus 20 zufällig auswählen.

#### Scenario: Liste mit mehr als 20 offenen Wörtern

- **WHEN** der Nutzer eine Sitzung für eine Liste mit 100 offenen Wörtern startet
- **THEN** umfasst der Durchgang genau 20 Karten

#### Scenario: Liste mit weniger als 20 offenen Wörtern

- **WHEN** der Nutzer eine Sitzung für eine Liste mit 12 offenen Wörtern startet
- **THEN** umfasst der Durchgang alle 12 Karten

#### Scenario: Auswahl wechselt zwischen Durchgängen

- **WHEN** der Nutzer zwei Durchgänge derselben Liste mit 100 offenen Wörtern startet
- **THEN** unterscheidet sich die Auswahl der Karten zwischen den Durchgängen
- **AND** über mehrere Durchgänge hinweg kann jedes offene Wort vorgelegt werden

### Requirement: Sitzung abschließen

Eine Sitzung MUSS enden, wenn alle Karten des Durchgangs bewertet wurden. Zum Abschluss MUSS eine Zusammenfassung mit der Anzahl gewusster und nicht gewusster Antworten sowie der in dieser Sitzung neu gelernten Wörter angezeigt werden.

#### Scenario: Letzte Karte bewertet

- **WHEN** der Nutzer die letzte Karte des Durchgangs bewertet
- **THEN** wird die Sitzungszusammenfassung angezeigt

#### Scenario: Sitzung vorzeitig verlassen

- **WHEN** der Nutzer die Sitzung vor der letzten Karte verlässt
- **THEN** bleiben alle bis dahin gespeicherten Bewertungen erhalten

#### Scenario: Serie nach Abbruch fortsetzen

- **WHEN** der Nutzer 7 von 20 Karten als "gewusst" bewertet, die Sitzung verlässt und später einen neuen Durchgang startet
- **THEN** steht der Zähler dieser 7 Wörter auf 1 und wird im neuen Durchgang weitergezählt
- **AND** die nicht bewerteten Wörter des abgebrochenen Durchgangs stehen weiterhin auf 0
