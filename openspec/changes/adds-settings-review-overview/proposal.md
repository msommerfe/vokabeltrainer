# Proposal

## Why

Bisher legt die App fest, wie lang eine Sitzung ist und ab wann ein Wort oder eine Übung als gelernt gilt. Das passt nicht für jeden Lernstil. Außerdem fehlt die Möglichkeit, gerade gewischte Karten nochmals anzusehen und sich schnell einen Überblick über alle Wörter einer Liste zu verschaffen.

## What Changes

- **Grundeinstellungen**: Ein neuer Bildschirm „Einstellungen“, erreichbar aus der Listenübersicht. Vokabeln und Übungen werden getrennt eingestellt:
  - **Sitzungsgröße**: Anzahl verschiedener Wörter bzw. Übungen pro Sitzung. Standard ist „alle“.
  - **Gelernt-Schwelle**: wie oft in Folge richtig, bis ein Wort als gelernt bzw. eine Übung als gelöst gilt. Standard ist 3 für Vokabeln und 1 für Übungen.
  - Die Einstellungen bleiben auf dem Gerät gespeichert.
- **Begrenzte Sitzung**: Ist eine Sitzungsgröße gesetzt, wählt die App zu Beginn so viele zufällige offene Wörter bzw. Übungen. Diese werden gemischt und wiederholt abgefragt, bis alle gelernt sind oder der Nutzer beendet.
- **Schwelle wirkt sofort**: Eine geänderte Schwelle gilt sofort auch für den vorhandenen Fortschritt. Wird sie gesenkt, können Wörter sofort als gelernt gelten. Wird sie erhöht, werden bereits gelernte Wörter wieder offen.
- **Übungen zählen in Folge**: Wie bei Vokabeln wird bei Übungen gezählt, wie oft sie in Folge richtig beantwortet wurden. Eine falsche Antwort setzt den Zähler zurück. Mit dem Standardwert 1 bleibt das bisherige Verhalten erhalten.
- **Zurückblättern in der Vokabelsitzung**: Mit „Zurück“ lassen sich bereits gewischte Karten der laufenden Sitzung nochmals ansehen, mindestens die letzten 10. Sie werden aufgedeckt mit ihrer Bewertung angezeigt. Die Bewertung bleibt unverändert, „Weiter“ führt zur aktuellen Karte zurück.
- **Kompaktübersicht je Liste**: Jede Liste bietet „Alle Vokabeln“ an: eine kompakte Tabelle aller Wortpaare mit einer Gelernt-Markierung je Richtung.

Nicht im Scope: Zurückblättern in der Übungssitzung, Bewertungen nachträglich ändern, Einstellungen je Liste, Suche oder Bearbeiten in der Kompaktübersicht.

## Capabilities

### New Capabilities

- `app-settings`: Grundeinstellungen der App (Sitzungsgröße und Gelernt-Schwelle, getrennt für Vokabeln und Übungen), deren Standardwerte, Gültigkeitsprüfung und dauerhafte Speicherung auf dem Gerät.

### Modified Capabilities

- `flashcard-session`: Eine Sitzung umfasst höchstens die eingestellte Anzahl Wörter; neue Anforderung zum Zurückblättern durch bereits bewertete Karten.
- `exercise-session`: Eine Übungssitzung umfasst höchstens die eingestellte Anzahl Übungen.
- `learning-progress`: Gelernt-Kriterium und Lernstand von Übungen richten sich nach der eingestellten Schwelle; Übungen zählen richtige Antworten in Folge.
- `vocabulary-library`: Neue Kompaktübersicht aller Wortpaare einer Liste mit Gelernt-Markierung je Richtung.

## Impact

- **Domain** (`src/domain/`): Gelernt- bzw. Gelöst-Status wird aus Zähler und Schwelle berechnet statt gespeichert, die Übungsbewertung erhält einen Zähler, die Sitzung wählt höchstens N Elemente aus.
- **Persistenz** (`src/storage/`): Übungsfortschritt mit Zähler. Alte Datensätze werden beim Lesen umgerechnet; eine Migration der Datenbank ist nicht nötig.
- **Oberfläche** (`src/ui/`): neue Bildschirme „Einstellungen“ und „Alle Vokabeln“, „Zurück“-Funktion in der Vokabelsitzung, Übergabe der Einstellungen an Sitzungen und Übersicht.
- **Dokumentation**: `README.md`.
- **Abhängigkeiten**: keine neuen.
