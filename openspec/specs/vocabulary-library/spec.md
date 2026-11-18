# vocabulary-library Specification

## Purpose
Verwaltet die Vokabellisten des Nutzers: Struktur eines Eintrags, Import aus JSON und CSV, mitgelieferte Beispiellisten und die Auswahl der aktiven Liste für eine Lernsitzung.

## Requirements

### Requirement: Struktur eines Vokabeleintrags

Ein Vokabeleintrag MUSS ein Wort in Sprache A und ein Wort in Sprache B enthalten und KANN beliebig viele Beispiele enthalten. Ein Beispiel besteht aus einem Satz in Sprache A und dem zugehörigen Satz in Sprache B.

#### Scenario: Eintrag ohne Beispiele

- **WHEN** eine Liste einen Eintrag nur mit Wort A und Wort B enthält
- **THEN** wird der Eintrag als gültig übernommen
- **AND** es werden keine Beispiele zu diesem Eintrag angezeigt

#### Scenario: Eintrag mit mehreren Beispielen

- **WHEN** eine Liste einen Eintrag mit zwei Beispielpaaren enthält
- **THEN** werden beide Beispiele mit dem Eintrag gespeichert und beim Aufdecken angezeigt

#### Scenario: Eintrag ohne Gegenstück

- **WHEN** ein Eintrag kein Wort in Sprache A oder kein Wort in Sprache B enthält
- **THEN** wird dieser Eintrag abgelehnt und dem Nutzer als fehlerhafte Zeile gemeldet

### Requirement: Benennung der beiden Sprachen

Eine Vokabelliste MUSS einen Namen und Bezeichnungen für Sprache A und Sprache B führen, damit der Nutzer die Abfragerichtung eindeutig erkennt.

#### Scenario: Sprachbezeichnungen fehlen in der Datei

- **WHEN** eine importierte Datei keine Sprachbezeichnungen enthält
- **THEN** verwendet das System die neutralen Bezeichnungen "Sprache A" und "Sprache B"
- **AND** der Import wird nicht abgelehnt

### Requirement: Import aus JSON

Das System MUSS Vokabellisten aus einer JSON-Datei importieren, die Listenname, Sprachbezeichnungen und die Einträge mit optionalen Beispielen abbildet.

#### Scenario: Gültige JSON-Datei

- **WHEN** der Nutzer eine gültige JSON-Datei mit 20 Einträgen auswählt
- **THEN** stehen alle 20 Einträge als auswählbare Liste zur Verfügung
- **AND** die Anzahl der importierten Einträge wird angezeigt

#### Scenario: Syntaktisch ungültiges JSON

- **WHEN** der Nutzer eine Datei auswählt, die kein gültiges JSON ist
- **THEN** wird kein Eintrag importiert
- **AND** es wird eine Fehlermeldung angezeigt, die die Datei als ungültig benennt

### Requirement: Import aus CSV

Das System MUSS Vokabellisten aus einer CSV-Datei importieren. Die Datei MUSS je eine Spalte für Sprache A und Sprache B enthalten; Beispiele KÖNNEN in weiteren Spalten stehen.

#### Scenario: Gültige CSV-Datei

- **WHEN** der Nutzer eine CSV-Datei mit Kopfzeile und 50 Datenzeilen auswählt
- **THEN** werden 50 Einträge importiert und als Liste bereitgestellt

#### Scenario: Einzelne fehlerhafte Zeilen

- **WHEN** eine CSV-Datei 50 Zeilen enthält, von denen 3 unvollständig sind
- **THEN** werden die 47 gültigen Zeilen importiert
- **AND** die 3 übersprungenen Zeilen werden mit ihrer Zeilennummer gemeldet

#### Scenario: Keine verwertbare Zeile

- **WHEN** eine CSV-Datei keine einzige gültige Zeile enthält
- **THEN** wird die Liste nicht angelegt
- **AND** es wird eine Fehlermeldung angezeigt

### Requirement: Mitgelieferte Beispiellisten

Das System MUSS vorinstallierte Vokabellisten bereitstellen, damit ohne eigenen Import sofort gelernt werden kann. Jeder Eintrag einer mitgelieferten Liste MUSS mindestens ein Beispiel enthalten; bei Verben MUSS ein Beispiel die Konjugation im Präsens zeigen.

#### Scenario: Erster Start ohne eigene Liste

- **WHEN** der Nutzer die App zum ersten Mal öffnet
- **THEN** sind drei Beispiellisten mit je 100 Einträgen auswählbar
- **AND** eine Lernsitzung kann ohne vorherigen Import gestartet werden

#### Scenario: Beispiel zu einem Verb

- **WHEN** der Nutzer die Übersetzung eines Verbs aus einer mitgelieferten Liste aufdeckt
- **THEN** zeigt ein Beispiel die sechs Präsensformen des Verbs
- **AND** ein weiteres Beispiel zeigt das Verb in einem einfachen Satz

#### Scenario: Beispiel zu einem Nicht-Verb

- **WHEN** der Nutzer die Übersetzung eines Nomens oder Adjektivs aus einer mitgelieferten Liste aufdeckt
- **THEN** zeigt mindestens ein Beispiel das Wort in einem einfachen Satz

### Requirement: Verwaltung importierter Listen

Importierte Listen MÜSSEN auf dem Gerät erhalten bleiben, in einer Übersicht auswählbar sein und einzeln gelöscht werden können.

#### Scenario: Liste nach Neustart weiterhin vorhanden

- **WHEN** der Nutzer eine Liste importiert und die App später erneut öffnet
- **THEN** ist die importierte Liste weiterhin in der Übersicht auswählbar

#### Scenario: Liste löschen

- **WHEN** der Nutzer eine importierte Liste löscht und bestätigt
- **THEN** verschwindet die Liste aus der Übersicht
- **AND** der zugehörige Lernfortschritt wird mit entfernt

#### Scenario: Erneuter Import derselben Liste

- **WHEN** der Nutzer eine Liste importiert, die denselben Namen wie eine vorhandene Liste trägt
- **THEN** fragt das System, ob die vorhandene Liste ersetzt oder eine zusätzliche Liste angelegt werden soll
