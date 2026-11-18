# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
