# Spec Delta

## Purpose

Führt den Lernstand je Wort und Abfragerichtung, entscheidet wann ein Wort als gelernt gilt und hält diesen Stand dauerhaft auf dem Gerät des Nutzers.

## ADDED Requirements

### Requirement: Serie korrekter Antworten

Das System MUSS je Wort und Abfragerichtung zählen, wie oft es in Folge als "gewusst" bewertet wurde. Eine Bewertung "nicht gewusst" MUSS diesen Zähler auf null zurücksetzen.

#### Scenario: Serie wächst

- **WHEN** ein Wort mit Zählerstand 1 erneut als "gewusst" bewertet wird
- **THEN** steht der Zähler für dieses Wort und diese Richtung auf 2

#### Scenario: Serie wird zurückgesetzt

- **WHEN** ein Wort mit Zählerstand 2 als "nicht gewusst" bewertet wird
- **THEN** steht der Zähler für dieses Wort und diese Richtung auf 0

### Requirement: Gelernt-Kriterium

Ein Wort MUSS in einer Abfragerichtung als gelernt gelten, sobald es dreimal in Folge als "gewusst" bewertet wurde. Ein als gelernt geltendes Wort MUSS aus den folgenden Sitzungen dieser Richtung ausgenommen werden.

#### Scenario: Dritte korrekte Antwort in Folge

- **WHEN** ein Wort mit Zählerstand 2 erneut als "gewusst" bewertet wird
- **THEN** gilt das Wort in dieser Richtung als gelernt
- **AND** der Nutzer wird in der Sitzungszusammenfassung darauf hingewiesen

#### Scenario: Gelerntes Wort erscheint nicht erneut

- **WHEN** eine neue Sitzung in derselben Richtung gestartet wird
- **THEN** enthält der Durchgang keine Wörter, die in dieser Richtung als gelernt gelten

### Requirement: Fortschritt je Richtung getrennt

Der Lernstand MUSS für A→B und B→A getrennt geführt werden, da beide Richtungen unterschiedlich schwer sind.

#### Scenario: Gelernt in nur einer Richtung

- **WHEN** ein Wort in Richtung A→B als gelernt gilt
- **THEN** bleibt es in Richtung B→A weiterhin abfragbar

### Requirement: Fortschrittsübersicht

Das System MUSS je Liste und Richtung anzeigen, wie viele Wörter gelernt sind und wie viele noch offen sind.

#### Scenario: Übersicht einer teilweise gelernten Liste

- **WHEN** der Nutzer eine Liste mit 100 Wörtern öffnet, von denen 40 in Richtung A→B gelernt sind
- **THEN** zeigt die Übersicht für diese Richtung 40 gelernte und 60 offene Wörter

### Requirement: Dauerhafte Speicherung auf dem Gerät

Der Lernfortschritt MUSS nach jeder Bewertung auf dem Gerät gespeichert werden und einen Neustart der App überstehen. Der Fortschritt DARF das Gerät nicht verlassen.

#### Scenario: Fortschritt nach Neustart

- **WHEN** der Nutzer Karten bewertet, die App schließt und später wieder öffnet
- **THEN** sind alle Zählerstände und Gelernt-Markierungen unverändert vorhanden

#### Scenario: Speicher nicht verfügbar

- **WHEN** der Browser das Speichern verweigert oder der Speicher voll ist
- **THEN** weist das System darauf hin, dass der Fortschritt nicht dauerhaft gesichert werden kann
- **AND** die laufende Sitzung bleibt bedienbar

#### Scenario: Speicherung je Bewertung

- **WHEN** der Nutzer eine einzelne Karte bewertet
- **THEN** ist der neue Zählerstand dieses Wortes gespeichert, bevor die nächste Karte bewertet werden kann
- **AND** ein Abbruch der Sitzung danach verliert diese Bewertung nicht

### Requirement: Fortschritt zurücksetzen

Der Nutzer MUSS den Lernfortschritt einer Liste zurücksetzen können. Das Zurücksetzen MUSS eine Bestätigung erfordern.

#### Scenario: Zurücksetzen bestätigt

- **WHEN** der Nutzer das Zurücksetzen einer Liste bestätigt
- **THEN** stehen alle Zähler dieser Liste auf 0
- **AND** kein Wort dieser Liste gilt mehr als gelernt

#### Scenario: Zurücksetzen abgebrochen

- **WHEN** der Nutzer die Bestätigung abbricht
- **THEN** bleibt der Fortschritt unverändert

### Requirement: Zuordnung des Fortschritts nach erneutem Import

Wird eine Liste erneut importiert, MUSS der Fortschritt für unveränderte Wörter erhalten bleiben. Für neu hinzugekommene Wörter MUSS der Zähler bei null beginnen.

#### Scenario: Erweiterte Liste importiert

- **WHEN** der Nutzer eine vorhandene Liste durch eine Fassung mit 10 zusätzlichen Wörtern ersetzt
- **THEN** bleibt der Fortschritt der bereits vorhandenen Wörter erhalten
- **AND** die 10 neuen Wörter starten mit Zählerstand 0
