# Spec Delta

## ADDED Requirements

### Requirement: Kompaktübersicht einer Liste

Jede Liste MUSS in der Listenübersicht eine Ansicht "Alle Vokabeln" anbieten. Sie MUSS alle Wortpaare der Liste kompakt in je einer Zeile zeigen, in der Reihenfolge der Liste. Je Zeile MUSS sichtbar sein, ob das Wort in Richtung A→B und in Richtung B→A als gelernt gilt, gemessen an der aktuellen Gelernt-Schwelle. Inhalte MÜSSEN als Text dargestellt werden.

#### Scenario: Übersicht öffnen

- **WHEN** der Nutzer bei einer Liste mit 100 Wörtern "Alle Vokabeln" wählt
- **THEN** zeigt das System 100 Zeilen mit je Wort A und Wort B
- **AND** die Spaltenköpfe nennen die beiden Sprachen der Liste

#### Scenario: Gelernt-Markierung je Richtung

- **WHEN** ein Wort nur in Richtung A→B als gelernt gilt
- **THEN** ist in seiner Zeile nur die Markierung für A→B gesetzt

#### Scenario: Ohne Beispiele

- **WHEN** die Übersicht ein Wort mit Beispielsätzen zeigt
- **THEN** werden die Beispielsätze nicht angezeigt

#### Scenario: Zurück zur Listenübersicht

- **WHEN** der Nutzer in der Kompaktübersicht "Übersicht" wählt
- **THEN** erscheint wieder die Listenübersicht
