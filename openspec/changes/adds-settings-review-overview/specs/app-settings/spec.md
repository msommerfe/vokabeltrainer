# Spec Delta

## Purpose

Legt fest, welche Grundeinstellungen der Nutzer für Lernsitzungen treffen kann, welche Standardwerte gelten und wie die Einstellungen auf dem Gerät erhalten bleiben.

## ADDED Requirements

### Requirement: Einstellungsbildschirm

Das System MUSS aus der Listenübersicht einen Bildschirm "Einstellungen" erreichbar machen. Darauf MÜSSEN getrennt für Vokabeln und für Übungen die Sitzungsgröße und die Gelernt-Schwelle einstellbar sein.

#### Scenario: Einstellungen öffnen

- **WHEN** der Nutzer in der Listenübersicht "Einstellungen" wählt
- **THEN** zeigt das System je einen Bereich für Vokabeln und für Übungen
- **AND** jeder Bereich enthält die Sitzungsgröße und die Anzahl richtiger Antworten in Folge bis gelernt bzw. gelöst

### Requirement: Standardwerte

Ohne eigene Einstellung MUSS die Sitzungsgröße für Vokabeln und Übungen "alle" sein. Die Gelernt-Schwelle MUSS ohne eigene Einstellung für Vokabeln 3 und für Übungen 1 betragen.

#### Scenario: Erster Start

- **WHEN** der Nutzer die Einstellungen zum ersten Mal öffnet
- **THEN** steht die Sitzungsgröße für Vokabeln und Übungen auf "alle"
- **AND** die Schwelle steht für Vokabeln auf 3 und für Übungen auf 1

### Requirement: Gültige Werte

Die Sitzungsgröße MUSS "alle" oder eine ganze Zahl ab 1 sein. Die Gelernt-Schwelle MUSS eine ganze Zahl von 1 bis 10 sein. Ungültige Eingaben DÜRFEN NICHT übernommen werden; der zuletzt gültige Wert MUSS erhalten bleiben.

#### Scenario: Schwelle außerhalb des Bereichs

- **WHEN** der Nutzer als Gelernt-Schwelle 0 oder 11 eingibt
- **THEN** wird der Wert nicht übernommen
- **AND** der zuletzt gültige Wert bleibt wirksam

#### Scenario: Sitzungsgröße leeren

- **WHEN** der Nutzer das Feld für die Sitzungsgröße leert
- **THEN** gilt die Sitzungsgröße "alle"

### Requirement: Dauerhafte Einstellungen

Geänderte Einstellungen MÜSSEN sofort wirksam werden, einen Neustart der App überstehen und DÜRFEN das Gerät nicht verlassen. Sind gespeicherte Einstellungen nicht lesbar, MÜSSEN die Standardwerte gelten.

#### Scenario: Einstellung nach Neustart

- **WHEN** der Nutzer die Sitzungsgröße für Vokabeln auf 20 setzt und die App neu startet
- **THEN** steht die Sitzungsgröße weiterhin auf 20

#### Scenario: Beschädigte Einstellungen

- **WHEN** die gespeicherten Einstellungen nicht gelesen werden können
- **THEN** gelten die Standardwerte
- **AND** die App bleibt bedienbar
