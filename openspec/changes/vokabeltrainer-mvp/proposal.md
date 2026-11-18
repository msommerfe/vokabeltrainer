# Proposal

## Why

Es gibt noch keine Anwendung in diesem Projekt. Zum Vokabellernen unterwegs fehlt ein einfacher, auf dem Handy bedienbarer Karteikarten-Trainer, der eigene Wortlisten verarbeitet und den Lernfortschritt behält.

## What Changes

Neuaufbau einer Progressive Web App (greenfield), die auf dem Handy installierbar und offline nutzbar ist.

- **Wortlisten**: Import eigener Listen als JSON und CSV; zusätzlich mitgelieferte Beispiellisten. Ein Eintrag besteht aus Wort in Sprache A, Wort in Sprache B und optional mehreren Beispielsätzen.
- **Karteikarten-Session**: Eine Karte zeigt das Abfragewort. Solange die Karte berührt wird, sind Übersetzung und Beispiele sichtbar; beim Loslassen verschwinden sie wieder. Ein Doppeltipp zeigt die Übersetzung dauerhaft bis zur nächsten Karte.
- **Sitzungsablauf**: Eine Sitzung umfasst alle offenen Wörter der gewählten Richtung. Die Karten werden zufällig gezogen; ein Wort kann erneut erscheinen, bevor alle anderen einmal abgefragt wurden. Gelernte Wörter fallen sofort heraus. Die Sitzung läuft, bis alle Wörter gelernt sind oder der Nutzer sie beendet.
- **Bewertung per Swipe**: Swipe nach rechts = gewusst, Swipe nach links = nicht gewusst.
- **Lernrichtung**: Abfrage in beide Richtungen (A→B und B→A), umschaltbar.
- **Gelernt-Status**: Ein Wort gilt nach 3× in Folge "gewusst" als gelernt und wird aus der aktiven Abfrage genommen. Ein "nicht gewusst" setzt die Serie zurück.
- **Fortschritt**: Lernstand wird lokal auf dem Gerät gespeichert und überlebt App-Neustarts.
- **Installierbar/Offline**: Web-App-Manifest und Service Worker, damit die App zum Homescreen hinzugefügt und ohne Netz genutzt werden kann.

Nicht im Scope: Benutzerkonten, Server-Backend, Synchronisation zwischen Geräten, Audio/Aussprache, Spaced-Repetition-Intervalle über den Streak-Zähler hinaus.

## Capabilities

### New Capabilities

- `vocabulary-library`: Struktur eines Vokabeleintrags (Sprache A, Sprache B, Beispiele), Import aus JSON und CSV, Validierung fehlerhafter Dateien, mitgelieferte Beispiellisten und Auswahl der aktiven Liste.
- `flashcard-session`: Ablauf einer Lernsitzung — Kartenauswahl, Abfragerichtung, Aufdecken der Übersetzung, Swipe-Bewertung, Ende der Sitzung.
- `learning-progress`: Zählung korrekter Antworten je Wort und Richtung, Gelernt-Kriterium, Zurücksetzen bei Fehler, lokale Persistenz des Fortschritts.
- `offline-app-shell`: Installierbarkeit auf dem Homescreen und Nutzbarkeit ohne Netzverbindung.

### Modified Capabilities

Keine — das Projekt enthält noch keine Specs.

## Impact

- Neues Frontend-Projekt im Repository (bisher leer): Build-Setup, Quellcode, Tests.
- Neue Abhängigkeiten: Web-Framework, Build-Tool, CSV-Parser, Testrunner — konkrete Auswahl in `design.md`.
- Persistenz ausschließlich im Browser-Storage des Geräts; kein Backend, keine Datenübertragung.
- Beispiel-Wortlisten als Assets im Repository.
