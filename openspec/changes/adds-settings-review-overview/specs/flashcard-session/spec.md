# Spec Delta

## ADDED Requirements

### Requirement: Zurückblättern durch bewertete Karten

Während einer Vokabelsitzung MUSS der Nutzer mit "Zurück" bereits bewertete Karten der laufenden Sitzung nochmals ansehen können, mindestens die letzten 10, schrittweise rückwärts. Eine zurückgeblätterte Karte MUSS aufgedeckt mit Übersetzung, Beispielen und ihrer Bewertung angezeigt werden. Sie DARF NICHT erneut bewertet werden. "Weiter" MUSS schrittweise vorwärts und zuletzt zur aktuellen Karte zurückführen.

#### Scenario: Eine Karte zurück

- **WHEN** der Nutzer eine Karte als "nicht gewusst" gewischt hat und auf "Zurück" tippt
- **THEN** wird diese Karte mit Übersetzung und Beispielen angezeigt
- **AND** sie ist als "nicht gewusst" gekennzeichnet

#### Scenario: Zehn Karten zurück

- **WHEN** der Nutzer in einer Sitzung 12 Karten bewertet hat und zehnmal auf "Zurück" tippt
- **THEN** zeigt das System nacheinander die zehn zuletzt bewerteten Karten in umgekehrter Reihenfolge

#### Scenario: Keine erneute Bewertung

- **WHEN** der Nutzer eine zurückgeblätterte Karte wischt
- **THEN** wird keine Bewertung gespeichert
- **AND** der Lernstand des Wortes bleibt unverändert

#### Scenario: Zurück zur aktuellen Karte

- **WHEN** der Nutzer drei Karten zurückgeblättert hat und dreimal auf "Weiter" tippt
- **THEN** erscheint wieder die aktuelle, noch nicht bewertete Karte mit verborgener Übersetzung

#### Scenario: Noch keine Karte bewertet

- **WHEN** in der laufenden Sitzung noch keine Karte bewertet wurde
- **THEN** ist "Zurück" nicht verfügbar

## MODIFIED Requirements

### Requirement: Sitzung starten

Vor dem Start einer Sitzung MUSS der Nutzer eine Vokabelliste und eine Abfragerichtung wählen. Die Sitzung MUSS nur Wörter umfassen, die in der gewählten Richtung noch nicht als gelernt gelten. Ist in den Einstellungen eine Sitzungsgröße für Vokabeln festgelegt und gibt es mehr offene Wörter, MUSS das System beim Start so viele offene Wörter zufällig auswählen; andernfalls MUSS die Sitzung alle offenen Wörter umfassen.

#### Scenario: Sitzung mit offenen Wörtern

- **WHEN** der Nutzer eine Liste mit 30 noch nicht gelernten Wörtern auswählt und die Sitzung startet
- **THEN** wird die erste Karte angezeigt
- **AND** die Anzahl der noch offenen Wörter ist sichtbar

#### Scenario: Alle Wörter bereits gelernt

- **WHEN** der Nutzer eine Liste auswählt, in der alle Wörter in dieser Richtung als gelernt gelten
- **THEN** wird keine Karte angezeigt
- **AND** das System meldet, dass die Liste in dieser Richtung abgeschlossen ist
- **AND** bietet an, den Fortschritt dieser Liste zurückzusetzen

#### Scenario: Begrenzte Sitzungsgröße

- **WHEN** die Sitzungsgröße für Vokabeln auf 20 steht und der Nutzer eine Sitzung für eine Liste mit 100 offenen Wörtern startet
- **THEN** umfasst die Sitzung genau 20 verschiedene Wörter
- **AND** die Sitzung endet, sobald diese 20 Wörter gelernt sind oder der Nutzer beendet

#### Scenario: Weniger offene Wörter als Sitzungsgröße

- **WHEN** die Sitzungsgröße für Vokabeln auf 20 steht und die Liste nur 12 offene Wörter hat
- **THEN** umfasst die Sitzung alle 12 Wörter

#### Scenario: Auswahl wechselt zwischen Sitzungen

- **WHEN** der Nutzer bei Sitzungsgröße 20 zwei Sitzungen derselben Liste mit 100 offenen Wörtern startet
- **THEN** unterscheidet sich die Auswahl der Wörter zwischen den Sitzungen
