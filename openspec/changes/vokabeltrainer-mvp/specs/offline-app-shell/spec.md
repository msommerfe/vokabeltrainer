# Spec Delta

## Purpose

Stellt sicher, dass der Vokabeltrainer auf dem Handy wie eine App vom Homescreen gestartet, ohne Netzverbindung genutzt und auf kleinen Touch-Displays bedient werden kann.

## ADDED Requirements

### Requirement: Installation auf dem Homescreen

Die Anwendung MUSS die Kriterien für eine installierbare Web-App erfüllen, sodass sie auf dem Handy zum Homescreen hinzugefügt werden kann.

#### Scenario: Zum Homescreen hinzufügen

- **WHEN** der Nutzer die App im Handy-Browser öffnet und sie zum Homescreen hinzufügt
- **THEN** erscheint ein Symbol mit Name und Icon der App
- **AND** ein Start über dieses Symbol öffnet die App ohne Browser-Adressleiste

### Requirement: Nutzung ohne Netzverbindung

Nach dem ersten erfolgreichen Laden MUSS die Anwendung vollständig ohne Netzverbindung startbar und bedienbar sein.

#### Scenario: Start im Flugmodus

- **WHEN** der Nutzer die App nach einem ersten Online-Besuch ohne Netzverbindung startet
- **THEN** lädt die App und zeigt die vorhandenen Listen an

#### Scenario: Lernen ohne Netzverbindung

- **WHEN** der Nutzer ohne Netzverbindung eine Sitzung durchführt
- **THEN** funktionieren Aufdecken, Swipe-Bewertung und Speicherung des Fortschritts unverändert

#### Scenario: Import ohne Netzverbindung

- **WHEN** der Nutzer ohne Netzverbindung eine lokale JSON- oder CSV-Datei importiert
- **THEN** wird die Liste importiert und steht zum Lernen bereit

### Requirement: Aktualisierung der installierten App

Erscheint eine neue Version, MUSS die Anwendung diese übernehmen, ohne dass Listen oder Lernfortschritt verloren gehen.

#### Scenario: Neue Version verfügbar

- **WHEN** die App mit Netzverbindung gestartet wird und eine neue Version vorliegt
- **THEN** wird die neue Version übernommen
- **AND** importierte Listen und Lernfortschritt bleiben erhalten

### Requirement: Bedienbarkeit auf dem Handy

Die Oberfläche MUSS für Hochformat auf Handy-Displays ausgelegt sein. Alle Bedienelemente MÜSSEN mit dem Daumen erreichbar und ohne Zoom treffsicher bedienbar sein.

#### Scenario: Anzeige im Hochformat

- **WHEN** die App auf einem Display mit 360 Pixel Breite geöffnet wird
- **THEN** ist die Karte vollständig sichtbar
- **AND** es ist kein horizontales Scrollen nötig

#### Scenario: Langes Wort auf der Karte

- **WHEN** ein Wort oder Beispielsatz länger ist als die Kartenbreite
- **THEN** wird der Text umgebrochen oder die Karte wächst, ohne dass Inhalt abgeschnitten wird
