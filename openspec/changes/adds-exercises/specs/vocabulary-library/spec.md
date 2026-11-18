# Spec Delta

## ADDED Requirements

### Requirement: Übungen im JSON-Format

Eine JSON-Datei MUSS zusätzlich zu den Einträgen einen optionalen Block mit Übungen enthalten können. Eine Übung ist entweder ein Lückentext (Satz mit einem oder mehreren markierten fehlenden Wörtern) oder eine Auswahlfrage (Frage, mindestens zwei Antwortmöglichkeiten, genau eine richtige Antwort). Jede Übung KANN eine kurze Erklärung enthalten.

#### Scenario: Liste mit Übungen importieren

- **WHEN** der Nutzer eine gültige JSON-Datei mit 20 Einträgen, 5 Lückentexten und 5 Auswahlfragen importiert
- **THEN** stehen die 20 Einträge und die 10 Übungen zur Verfügung
- **AND** die Anzahl der importierten Übungen wird angezeigt

#### Scenario: Liste ohne Übungsblock

- **WHEN** der Nutzer eine JSON-Datei ohne Übungsblock importiert
- **THEN** wird die Liste wie bisher ohne Übungen importiert

#### Scenario: Übung ohne Erklärung

- **WHEN** eine Übung keine Erklärung enthält
- **THEN** wird die Übung als gültig übernommen

### Requirement: Validierung von Übungen

Fehlerhafte Übungen MÜSSEN einzeln übersprungen und mit ihrer Position im Übungsblock und dem Grund gemeldet werden, ohne den Import der übrigen Einträge und Übungen zu verhindern. Doppelte Übungen innerhalb einer Liste MÜSSEN als Duplikat gemeldet werden.

#### Scenario: Lückentext ohne Lücke

- **WHEN** ein Lückentext keine markierte Lücke enthält
- **THEN** wird diese Übung übersprungen und als fehlerhaft gemeldet

#### Scenario: Auswahlfrage mit ungültiger Lösung

- **WHEN** die angegebene richtige Antwort einer Auswahlfrage keiner der Antwortmöglichkeiten entspricht
- **THEN** wird diese Übung übersprungen und als fehlerhaft gemeldet

#### Scenario: Auswahlfrage mit zu wenigen Antworten

- **WHEN** eine Auswahlfrage weniger als zwei Antwortmöglichkeiten enthält
- **THEN** wird diese Übung übersprungen und als fehlerhaft gemeldet

#### Scenario: Unbekannter Übungstyp

- **WHEN** eine Übung einen unbekannten Typ angibt
- **THEN** wird diese Übung übersprungen und als fehlerhaft gemeldet

#### Scenario: Übrige Inhalte bleiben erhalten

- **WHEN** eine Datei 10 Übungen enthält, von denen 2 fehlerhaft sind
- **THEN** werden alle gültigen Einträge und die 8 gültigen Übungen importiert
- **AND** die 2 übersprungenen Übungen werden mit ihrer Position gemeldet

### Requirement: Aktualisierung mitgelieferter Listen

Enthält eine neue App-Version geänderte mitgelieferte Listen, MÜSSEN die in einer bestehenden Installation vorhandenen mitgelieferten Listen beim nächsten Start auf den neuen Stand gebracht werden. Der Lernfortschritt unveränderter Einträge und Übungen MUSS dabei erhalten bleiben. Vom Nutzer gelöschte mitgelieferte Listen DÜRFEN NICHT erneut angelegt werden.

#### Scenario: Bestehende Installation erhält Übungen

- **WHEN** der Nutzer eine Installation mit Lernfortschritt in einer mitgelieferten Liste auf die neue Version aktualisiert
- **THEN** enthält die Liste nach dem Start die neuen Übungen
- **AND** der Vokabelfortschritt dieser Liste ist unverändert

#### Scenario: Gelöschte mitgelieferte Liste

- **WHEN** der Nutzer eine mitgelieferte Liste gelöscht hat und die App auf die neue Version aktualisiert wird
- **THEN** erscheint diese Liste nach dem Start nicht wieder

## MODIFIED Requirements

### Requirement: Mitgelieferte Beispiellisten

Das System MUSS vorinstallierte Vokabellisten bereitstellen, damit ohne eigenen Import sofort gelernt werden kann. Jeder Eintrag einer mitgelieferten Liste MUSS mindestens ein Beispiel enthalten; bei Verben MUSS ein Beispiel die Konjugation im Präsens zeigen. Jede mitgelieferte Liste MUSS Übungen beider Typen enthalten, jeweils mit Erklärung.

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

#### Scenario: Übungen in mitgelieferten Listen

- **WHEN** der Nutzer die Übersicht der mitgelieferten Listen öffnet
- **THEN** bietet jede der drei Listen den Einstieg "Übungen" an
- **AND** jede Liste enthält mindestens einen Lückentext und mindestens eine Auswahlfrage, jeweils mit Erklärung
