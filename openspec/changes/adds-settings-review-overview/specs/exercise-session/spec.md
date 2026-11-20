# Spec Delta

## MODIFIED Requirements

### Requirement: Übungssitzung starten

Eine Übungssitzung MUSS nur noch nicht gelöste Übungen der gewählten Liste umfassen. Ist in den Einstellungen eine Sitzungsgröße für Übungen festgelegt und gibt es mehr offene Übungen, MUSS das System beim Start so viele offene Übungen zufällig auswählen; andernfalls MUSS die Sitzung alle offenen Übungen umfassen.

#### Scenario: Offene Übungen vorhanden

- **WHEN** der Nutzer den Einstieg "Übungen" einer Liste mit offenen Übungen wählt
- **THEN** wird die erste Übung angezeigt
- **AND** die Anzahl der noch offenen Übungen ist sichtbar

#### Scenario: Alle Übungen gelöst

- **WHEN** der Nutzer den Einstieg "Übungen" einer Liste wählt, deren Übungen alle gelöst sind
- **THEN** wird keine Übung angezeigt
- **AND** das System meldet, dass alle Übungen gelöst sind
- **AND** bietet an, den Übungsfortschritt dieser Liste zurückzusetzen

#### Scenario: Begrenzte Übungssitzung

- **WHEN** die Sitzungsgröße für Übungen auf 5 steht und die Liste 20 offene Übungen enthält
- **THEN** umfasst die Übungssitzung genau 5 verschiedene Übungen
- **AND** die Sitzung endet, sobald diese 5 Übungen gelöst sind oder der Nutzer beendet
