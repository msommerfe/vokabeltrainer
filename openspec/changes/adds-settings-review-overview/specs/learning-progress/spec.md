# Spec Delta

## MODIFIED Requirements

### Requirement: Gelernt-Kriterium

Ein Wort MUSS in einer Abfragerichtung als gelernt gelten, sobald es so oft in Folge als "gewusst" bewertet wurde, wie die Gelernt-Schwelle für Vokabeln in den Einstellungen vorgibt (Standard 3). Eine geänderte Schwelle MUSS sofort auch für den vorhandenen Fortschritt gelten. Ein als gelernt geltendes Wort MUSS sofort aus der laufenden Sitzung und aus folgenden Sitzungen dieser Richtung ausgenommen werden.

#### Scenario: Dritte korrekte Antwort in Folge

- **WHEN** die Schwelle für Vokabeln auf 3 steht und ein Wort mit Zählerstand 2 erneut als "gewusst" bewertet wird
- **THEN** gilt das Wort in dieser Richtung als gelernt
- **AND** das Wort erscheint in der laufenden Sitzung nicht mehr
- **AND** der Nutzer wird in der Sitzungszusammenfassung darauf hingewiesen

#### Scenario: Gelerntes Wort erscheint nicht erneut

- **WHEN** eine neue Sitzung in derselben Richtung gestartet wird
- **THEN** enthält die Sitzung keine Wörter, die in dieser Richtung als gelernt gelten

#### Scenario: Höhere Schwelle

- **WHEN** die Schwelle für Vokabeln auf 5 steht und ein Wort mit Zählerstand 3 erneut als "gewusst" bewertet wird
- **THEN** steht der Zähler auf 4
- **AND** das Wort gilt noch nicht als gelernt

#### Scenario: Schwelle gesenkt

- **WHEN** ein Wort mit Zählerstand 2 noch offen ist und der Nutzer die Schwelle für Vokabeln von 3 auf 2 senkt
- **THEN** gilt das Wort ab sofort als gelernt

#### Scenario: Schwelle erhöht

- **WHEN** ein Wort mit Zählerstand 3 als gelernt gilt und der Nutzer die Schwelle für Vokabeln von 3 auf 4 erhöht
- **THEN** gilt das Wort wieder als offen
- **AND** ein weiteres "gewusst" macht es wieder zu einem gelernten Wort

### Requirement: Lernstand von Übungen

Das System MUSS je Übung zählen, wie oft sie in Folge richtig beantwortet wurde. Eine falsche Antwort MUSS diesen Zähler auf null zurücksetzen. Eine Übung MUSS als gelöst gelten, sobald der Zähler die Gelernt-Schwelle für Übungen aus den Einstellungen erreicht (Standard 1), und MUSS dann aus der laufenden und aus folgenden Übungssitzungen dieser Liste ausgenommen werden. Eine geänderte Schwelle MUSS sofort auch für den vorhandenen Fortschritt gelten. Der Übungsfortschritt MUSS nach jeder Antwort auf dem Gerät gespeichert werden und DARF das Gerät nicht verlassen.

#### Scenario: Übung einmal richtig gelöst

- **WHEN** die Schwelle für Übungen auf 1 steht und der Nutzer eine offene Übung richtig beantwortet
- **THEN** gilt die Übung als gelöst
- **AND** sie erscheint in folgenden Übungssitzungen dieser Liste nicht mehr

#### Scenario: Übung falsch beantwortet

- **WHEN** der Nutzer eine offene Übung falsch beantwortet
- **THEN** bleibt die Übung offen
- **AND** ihr Zähler steht auf 0

#### Scenario: Höhere Schwelle für Übungen

- **WHEN** die Schwelle für Übungen auf 2 steht und der Nutzer eine offene Übung zum ersten Mal richtig beantwortet
- **THEN** bleibt die Übung offen
- **AND** nach einer weiteren richtigen Antwort in Folge gilt sie als gelöst

#### Scenario: Bisher gelöste Übungen bleiben gelöst

- **WHEN** die App mit einer Übung startet, die vor dieser Änderung als gelöst gespeichert wurde, und die Schwelle für Übungen auf 1 steht
- **THEN** gilt die Übung weiterhin als gelöst

#### Scenario: Übungsfortschritt nach Neustart

- **WHEN** der Nutzer Übungen löst, die App schließt und später wieder öffnet
- **THEN** sind dieselben Übungen weiterhin als gelöst markiert

#### Scenario: Übungen beeinflussen den Vokabelfortschritt nicht

- **WHEN** der Nutzer eine Übung löst, deren Satz ein Wort der Liste enthält
- **THEN** bleibt der Vokabelfortschritt dieses Wortes in beiden Richtungen unverändert
