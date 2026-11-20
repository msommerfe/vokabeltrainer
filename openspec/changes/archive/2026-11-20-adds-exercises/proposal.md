# Proposal

## Why

Bisher lassen sich nur einzelne Wörter abfragen. Für das Verständnis im Satzzusammenhang und für Grammatikregeln fehlen Übungen, die der Nutzer zusammen mit seinen Vokabeln in derselben JSON-Datei pflegen kann.

## What Changes

- **Übungen im JSON-Format**: Eine Liste kann zusätzlich zu den Vokabeln einen Block `exercises` enthalten. Es gibt zwei Übungstypen:
  - **Lückentext**: ein Satz mit einem oder mehreren fehlenden Wörtern.
  - **Auswahlfrage**: eine Frage mit mehreren Antwortmöglichkeiten (A, B, C …), von denen genau eine richtig ist.
  - Jede Übung kann eine kurze Erklärung enthalten.
- **Dritter Einstieg je Liste**: Neben „Sprache A → Sprache B“ und „Sprache B → Sprache A“ bietet jede Liste mit Übungen den Einstieg „Übungen“.
- **Lückentext lösen**: Berühren zeigt die fehlenden Wörter und die Erklärung, Loslassen verbirgt sie, ein Doppeltipp hält sie fest. Die Bewertung erfolgt per Wischen wie bei den Vokabeln.
- **Auswahlfrage lösen**: Der Nutzer tippt eine Antwort an und sieht sofort, ob sie richtig war, die richtige Lösung und die Erklärung.
- **Fortschritt bei Übungen**: Eine Übung gilt nach **einmal richtig** als gelöst und fällt aus der Abfrage. Der Übungsfortschritt wird getrennt vom Vokabelfortschritt gespeichert und lässt sich separat zurücksetzen.
- **Beispieldaten**: Die drei mitgelieferten Spanisch-Listen erhalten Übungen beider Typen mit Erklärungen. Bereits installierte Apps übernehmen die erweiterten Listen, ohne dass Lernfortschritt verloren geht.

Nicht im Scope: Übungen im CSV-Import, Freitext-Eingabe von Antworten, weitere Übungstypen, Übungen in beide Sprachrichtungen.

## Capabilities

### New Capabilities

- `exercise-session`: Ablauf einer Übungssitzung – Einstieg je Liste, Darstellung und Lösen von Lückentexten und Auswahlfragen, Anzeige der Erklärung, Auswahl der nächsten Übung und Abschluss der Sitzung.

### Modified Capabilities

- `vocabulary-library`: Das JSON-Format erhält einen optionalen Übungsblock mit Validierung; die mitgelieferten Listen enthalten Übungen und werden in bestehenden Installationen aktualisiert.
- `learning-progress`: Übungen bekommen einen eigenen Lernstand (einmal richtig = gelöst), der getrennt zurückgesetzt wird und einen erneuten Import übersteht; das bisherige Zurücksetzen betrifft nur noch die Vokabeln.

## Impact

- Datenmodell und JSON-Import (`src/domain/`, `src/import/`): neue Übungstypen, Validierung, stabiler Schlüssel je Übung.
- Persistenz (`src/storage/`): zusätzlicher Speicherbereich für Übungsfortschritt, Versionssprung der IndexedDB mit Migration ohne Datenverlust.
- Oberfläche (`src/ui/`): dritter Einstieg in der Listenübersicht, neue Übungsansicht, separates Zurücksetzen.
- Beispieldaten (`public/samples/`) und deren Tests; Dokumentation des Formats in `README.md`.
- Keine neuen Abhängigkeiten.
