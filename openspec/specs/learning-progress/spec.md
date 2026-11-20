# learning-progress Specification

## Purpose
Führt den Lernstand je Wort und Abfragerichtung, entscheidet wann ein Wort als gelernt gilt und hält diesen Stand dauerhaft auf dem Gerät des Nutzers.

## Requirements

### Requirement: Serie korrekter Antworten

Das System MUSS je Wort und Abfragerichtung zählen, wie oft es in Folge als "gewusst" bewertet wurde. Eine Bewertung "nicht gewusst" MUSS diesen Zähler auf null zurücksetzen.

#### Scenario: Serie wächst

- **WHEN** ein Wort mit Zählerstand 1 erneut als "gewusst" bewertet wird
- **THEN** steht der Zähler für dieses Wort und diese Richtung auf 2

#### Scenario: Serie wird zurückgesetzt

- **WHEN** ein Wort mit Zählerstand 2 als "nicht gewusst" bewertet wird
- **THEN** steht der Zähler für dieses Wort und diese Richtung auf 0

### Requirement: Gelernt-Kriterium

Ein Wort MUSS in einer Abfragerichtung als gelernt gelten, sobald es dreimal in Folge als "gewusst" bewertet wurde. Ein als gelernt geltendes Wort MUSS sofort aus der laufenden Sitzung und aus folgenden Sitzungen dieser Richtung ausgenommen werden.

#### Scenario: Dritte korrekte Antwort in Folge

- **WHEN** ein Wort mit Zählerstand 2 erneut als "gewusst" bewertet wird
- **THEN** gilt das Wort in dieser Richtung als gelernt
- **AND** das Wort erscheint in der laufenden Sitzung nicht mehr
- **AND** der Nutzer wird in der Sitzungszusammenfassung darauf hingewiesen

#### Scenario: Gelerntes Wort erscheint nicht erneut

- **WHEN** eine neue Sitzung in derselben Richtung gestartet wird
- **THEN** enthält die Sitzung keine Wörter, die in dieser Richtung als gelernt gelten

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

Der Nutzer MUSS den Vokabelfortschritt einer Liste zurücksetzen können. Das Zurücksetzen MUSS eine Bestätigung erfordern und DARF den Übungsfortschritt nicht verändern.

#### Scenario: Zurücksetzen bestätigt

- **WHEN** der Nutzer das Zurücksetzen einer Liste bestätigt
- **THEN** stehen alle Zähler dieser Liste auf 0
- **AND** kein Wort dieser Liste gilt mehr als gelernt
- **AND** der Übungsfortschritt dieser Liste bleibt unverändert

#### Scenario: Zurücksetzen abgebrochen

- **WHEN** der Nutzer die Bestätigung abbricht
- **THEN** bleibt der Fortschritt unverändert

### Requirement: Zuordnung des Fortschritts nach erneutem Import

Wird eine Liste erneut importiert, MUSS der Fortschritt für unveränderte Wörter erhalten bleiben. Für neu hinzugekommene Wörter MUSS der Zähler bei null beginnen.

#### Scenario: Erweiterte Liste importiert

- **WHEN** der Nutzer eine vorhandene Liste durch eine Fassung mit 10 zusätzlichen Wörtern ersetzt
- **THEN** bleibt der Fortschritt der bereits vorhandenen Wörter erhalten
- **AND** die 10 neuen Wörter starten mit Zählerstand 0

### Requirement: Lernstand von Übungen

Das System MUSS je Übung speichern, ob sie gelöst ist. Eine Übung MUSS als gelöst gelten, sobald sie einmal richtig beantwortet wurde, und MUSS dann aus folgenden Übungssitzungen dieser Liste ausgenommen werden. Eine falsche Antwort DARF eine Übung nicht als gelöst markieren. Der Übungsfortschritt MUSS nach jeder Antwort auf dem Gerät gespeichert werden und DARF das Gerät nicht verlassen.

#### Scenario: Übung einmal richtig gelöst

- **WHEN** der Nutzer eine offene Übung richtig beantwortet
- **THEN** gilt die Übung als gelöst
- **AND** sie erscheint in folgenden Übungssitzungen dieser Liste nicht mehr

#### Scenario: Übung falsch beantwortet

- **WHEN** der Nutzer eine offene Übung falsch beantwortet
- **THEN** bleibt die Übung offen

#### Scenario: Übungsfortschritt nach Neustart

- **WHEN** der Nutzer Übungen löst, die App schließt und später wieder öffnet
- **THEN** sind dieselben Übungen weiterhin als gelöst markiert

#### Scenario: Übungen beeinflussen den Vokabelfortschritt nicht

- **WHEN** der Nutzer eine Übung löst, deren Satz ein Wort der Liste enthält
- **THEN** bleibt der Vokabelfortschritt dieses Wortes in beiden Richtungen unverändert

### Requirement: Übungsfortschritt zurücksetzen

Der Nutzer MUSS den Übungsfortschritt einer Liste getrennt vom Vokabelfortschritt zurücksetzen können. Das Zurücksetzen MUSS eine Bestätigung erfordern.

#### Scenario: Übungsfortschritt zurückgesetzt

- **WHEN** der Nutzer das Zurücksetzen des Übungsfortschritts einer Liste bestätigt
- **THEN** gilt keine Übung dieser Liste mehr als gelöst
- **AND** der Vokabelfortschritt dieser Liste bleibt unverändert

#### Scenario: Zurücksetzen der Übungen abgebrochen

- **WHEN** der Nutzer die Bestätigung abbricht
- **THEN** bleibt der Übungsfortschritt unverändert

### Requirement: Übungsfortschritt nach erneutem Import

Wird eine Liste erneut importiert oder ersetzt, MUSS der Fortschritt unveränderter Übungen erhalten bleiben. Neu hinzugekommene Übungen MÜSSEN offen beginnen. Eine geänderte Erklärung DARF den Fortschritt einer Übung nicht zurücksetzen.

#### Scenario: Liste um Übungen erweitert

- **WHEN** der Nutzer eine vorhandene Liste durch eine Fassung mit 5 zusätzlichen Übungen ersetzt
- **THEN** bleiben bereits gelöste Übungen gelöst
- **AND** die 5 neuen Übungen sind offen

#### Scenario: Erklärung korrigiert

- **WHEN** der Nutzer eine Liste erneut importiert, in der nur die Erklärung einer gelösten Übung geändert wurde
- **THEN** bleibt diese Übung gelöst
