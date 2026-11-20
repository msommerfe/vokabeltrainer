# exercise-session Specification

## Purpose
Beschreibt den Ablauf einer Übungssitzung zu einer Vokabelliste: Einstieg über die Liste, Lösen von Lückentexten und Auswahlfragen, Anzeige der Erklärung und Abschluss der Sitzung.

## Requirements

### Requirement: Einstieg in die Übungen

Jede Liste, die mindestens eine Übung enthält, MUSS in der Listenübersicht neben den beiden Abfragerichtungen einen dritten Einstieg "Übungen" anbieten. Der Einstieg MUSS anzeigen, wie viele Übungen gelöst und wie viele offen sind.

#### Scenario: Liste mit Übungen

- **WHEN** der Nutzer die Übersicht öffnet und eine Liste 12 Übungen enthält, von denen 4 gelöst sind
- **THEN** zeigt die Liste neben "Sprache A → Sprache B" und "Sprache B → Sprache A" den Einstieg "Übungen"
- **AND** der Einstieg zeigt 4 gelöste und 8 offene Übungen

#### Scenario: Liste ohne Übungen

- **WHEN** eine Liste keine Übungen enthält
- **THEN** zeigt die Übersicht für diese Liste keinen Einstieg "Übungen"

### Requirement: Übungssitzung starten

Eine Übungssitzung MUSS alle noch nicht gelösten Übungen der gewählten Liste umfassen, und nur diese.

#### Scenario: Offene Übungen vorhanden

- **WHEN** der Nutzer den Einstieg "Übungen" einer Liste mit offenen Übungen wählt
- **THEN** wird die erste Übung angezeigt
- **AND** die Anzahl der noch offenen Übungen ist sichtbar

#### Scenario: Alle Übungen gelöst

- **WHEN** der Nutzer den Einstieg "Übungen" einer Liste wählt, deren Übungen alle gelöst sind
- **THEN** wird keine Übung angezeigt
- **AND** das System meldet, dass alle Übungen gelöst sind
- **AND** bietet an, den Übungsfortschritt dieser Liste zurückzusetzen

### Requirement: Lückentext anzeigen und aufdecken

Ein Lückentext MUSS mit sichtbar markierten Lücken anstelle der fehlenden Wörter angezeigt werden. Die fehlenden Wörter und die Erklärung MÜSSEN sichtbar sein, solange der Nutzer die Karte berührt, und beim Loslassen wieder verborgen werden. Ein Doppeltipp MUSS sie bis zur nächsten Übung sichtbar halten.

#### Scenario: Lücken vor dem Aufdecken

- **WHEN** ein Lückentext "Yo {hablo} español." angezeigt wird
- **THEN** zeigt die Karte den Satz mit einer markierten Lücke anstelle von "hablo"
- **AND** das fehlende Wort ist nicht sichtbar

#### Scenario: Aufdecken bei Berührung

- **WHEN** der Nutzer die Karte eines Lückentexts berührt
- **THEN** werden die fehlenden Wörter sofort hervorgehoben im Satz angezeigt
- **AND** die Erklärung wird angezeigt, sofern vorhanden

#### Scenario: Verbergen beim Loslassen

- **WHEN** der Nutzer die Karte loslässt, ohne zuvor doppelt getippt zu haben
- **THEN** werden die fehlenden Wörter und die Erklärung wieder verborgen

#### Scenario: Festhalten per Doppeltipp

- **WHEN** der Nutzer die Karte eines Lückentexts doppelt antippt
- **THEN** bleiben Lösung und Erklärung sichtbar, bis die nächste Übung erscheint

#### Scenario: Mehrere Lücken

- **WHEN** ein Lückentext zwei Lücken enthält und aufgedeckt wird
- **THEN** werden beide fehlenden Wörter an ihrer jeweiligen Stelle angezeigt

### Requirement: Lückentext bewerten

Der Nutzer MUSS einen Lückentext per Wischen bewerten: Wischen nach rechts bedeutet "richtig", Wischen nach links bedeutet "falsch". Unterhalb der Auslöseschwelle MUSS die Karte ohne Bewertung zurückspringen.

#### Scenario: Wischen nach rechts

- **WHEN** der Nutzer einen Lückentext nach rechts wischt
- **THEN** wird die Übung als richtig gewertet
- **AND** die nächste Übung erscheint mit verborgener Lösung

#### Scenario: Wischen nach links

- **WHEN** der Nutzer einen Lückentext nach links wischt
- **THEN** wird die Übung als falsch gewertet
- **AND** die nächste Übung erscheint mit verborgener Lösung

### Requirement: Auswahlfrage beantworten

Eine Auswahlfrage MUSS die Frage und alle Antwortmöglichkeiten in der Reihenfolge der Datei, mit A, B, C … beschriftet, anzeigen. Tippt der Nutzer eine Antwort an, MUSS das System sofort anzeigen, ob sie richtig war, die richtige Antwort kennzeichnen und die Erklärung einblenden. Danach DARF keine weitere Antwort mehr gewählt werden.

#### Scenario: Richtige Antwort gewählt

- **WHEN** der Nutzer bei einer Auswahlfrage die richtige Antwort antippt
- **THEN** wird die gewählte Antwort als richtig gekennzeichnet
- **AND** die Erklärung wird angezeigt, sofern vorhanden
- **AND** die Übung wird als richtig gewertet

#### Scenario: Falsche Antwort gewählt

- **WHEN** der Nutzer bei einer Auswahlfrage eine falsche Antwort antippt
- **THEN** wird die gewählte Antwort als falsch und die richtige Antwort als richtig gekennzeichnet
- **AND** die Erklärung wird angezeigt, sofern vorhanden
- **AND** die Übung wird als falsch gewertet

#### Scenario: Keine zweite Antwort

- **WHEN** der Nutzer nach seiner Antwort eine weitere Antwortmöglichkeit antippt
- **THEN** ändert sich weder die Kennzeichnung noch die Bewertung

#### Scenario: Weiter zur nächsten Übung

- **WHEN** der Nutzer nach seiner Antwort auf "Weiter" tippt
- **THEN** erscheint die nächste Übung

### Requirement: Auswahl der nächsten Übung

Jede nächste Übung MUSS zufällig aus den aktuell offenen Übungen gezogen werden. Eine Übung DARF erneut vorgelegt werden, bevor alle anderen einmal dran waren, SOLL aber nicht zweimal direkt hintereinander erscheinen, solange mehr als eine Übung offen ist. Eine gelöste Übung MUSS sofort aus der Auswahl entfernt werden.

#### Scenario: Gelöste Übung fällt heraus

- **WHEN** der Nutzer eine Übung richtig löst
- **THEN** erscheint diese Übung in der laufenden Sitzung nicht mehr

#### Scenario: Falsch gelöste Übung kommt wieder

- **WHEN** der Nutzer eine Übung falsch löst und weitere Übungen offen sind
- **THEN** kann die Übung später in derselben Sitzung erneut erscheinen
- **AND** sie erscheint nicht direkt als nächste Übung

### Requirement: Übungssitzung abschließen

Eine Übungssitzung MUSS enden, wenn alle Übungen der Liste gelöst sind oder der Nutzer sie beendet. Zum Abschluss MUSS eine Zusammenfassung mit der Anzahl richtiger und falscher Antworten sowie der in dieser Sitzung neu gelösten Übungen angezeigt werden.

#### Scenario: Letzte Übung gelöst

- **WHEN** der Nutzer die letzte offene Übung richtig löst
- **THEN** wird die Zusammenfassung angezeigt

#### Scenario: Sitzung beenden

- **WHEN** der Nutzer auf "Beenden" tippt
- **THEN** wird die Zusammenfassung angezeigt
- **AND** alle bis dahin gespeicherten Ergebnisse bleiben erhalten

### Requirement: Übungsinhalte als Text darstellen

Sätze, Fragen, Antwortmöglichkeiten und Erklärungen aus importierten Dateien MÜSSEN ausschließlich als Text dargestellt und DÜRFEN NICHT als Markup interpretiert werden.

#### Scenario: Markup in einer Erklärung

- **WHEN** die Erklärung einer Übung den Text "<b>wichtig</b>" enthält
- **THEN** wird genau dieser Text angezeigt, ohne Fettdruck
