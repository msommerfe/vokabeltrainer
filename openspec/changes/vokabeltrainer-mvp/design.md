# Design

## Context

Das Repository ist leer — es gibt keinen bestehenden Code, keine Build-Konfiguration und keine Specs. Die Technologiewahl ist daher vollständig offen. Motivation und Umfang: siehe `proposal.md`. Anforderungen: siehe `specs/`.

Prägende Rahmenbedingungen:

- Zielgerät ist das Handy, Hauptinteraktion sind Touch-Gesten (Swipe, langer Druck, Doppeltipp).
- Kein Backend, keine Benutzerkonten. Alle Daten liegen auf dem Gerät.
- Die App muss offline starten und laufen.
- Es ist ein Einzelnutzer-Projekt; einfache Wartbarkeit wiegt schwerer als Skalierbarkeit.

## Goals / Non-Goals

**Goals:**

- Ein einziges Frontend-Artefakt, das als statische Dateien ausgeliefert und auf dem Homescreen installiert werden kann.
- Lernlogik (Streak, Gelernt-Kriterium, Richtung) frei von UI-Abhängigkeiten, damit sie ohne Browser testbar ist.
- Import von JSON und CSV über ein gemeinsames internes Modell, damit beide Formate denselben Validierungspfad nutzen.
- Fortschritt getrennt von den Wortlisten speichern, damit ein erneuter Import den Lernstand nicht zerstört.

**Non-Goals:**

- Keine Server-Komponente, keine Build-Pipeline für mehrere Umgebungen.
- Keine Mehrsprachigkeit der Oberfläche selbst (nur Deutsch).
- Kein Spaced-Repetition-Algorithmus mit Zeitintervallen; der Streak-Zähler ist das Lernmodell.

## Decisions

### Entscheidung 1: PWA mit Vite + React + TypeScript

Statische PWA, gebaut mit Vite, Oberfläche in React, durchgängig TypeScript.

**Warum:** Vite liefert eine statische Ausgabe, die auf jedem Static Host (z.B. GitHub Pages) ohne Serverlogik läuft — passend zu "kein Backend". TypeScript sichert das Vokabelmodell und die Importpfade ab, in denen fremde Dateien verarbeitet werden. React deckt den überschaubaren UI-Umfang ab und ist gut dokumentiert.

**Alternativen:**

- *Native App (React Native/Flutter)*: Vom Nutzer verworfen. Erfordert App-Store-Verteilung oder Sideloading für ein privates Einzelnutzer-Projekt.
- *Reines HTML/JS ohne Framework*: Weniger Abhängigkeiten, aber Zustandsführung über Sitzung, Listenverwaltung und Aufdeck-Zustand von Hand ist fehleranfälliger als der Mehrwert.
- *Svelte*: Kleineres Bundle, aber React ist für dieses Projekt die besser belegte Wahl.

### Entscheidung 2: Lernlogik als reine Funktionen, getrennt von React

Streak-Zähler, Gelernt-Kriterium, Kartenauswahl und Richtungslogik liegen in reinen TypeScript-Modulen ohne React-Import. Die UI ruft sie auf und stellt das Ergebnis dar.

**Warum:** Die Kernregeln aus `learning-progress` (3× in Folge, Reset bei Fehler, Trennung je Richtung) sind das, was tatsächlich schiefgehen kann. Als reine Funktionen sind sie direkt mit Unit-Tests abdeckbar, ohne Browser oder Rendering.

**Alternativen:** Logik in Komponenten/Hooks — erfordert zum Testen Rendering-Infrastruktur für Regeln, die keine UI brauchen.

### Entscheidung 3: IndexedDB für Fortschritt und Listen, nicht localStorage

Importierte Listen und Lernfortschritt liegen in IndexedDB.

**Warum:** `localStorage` ist auf wenige Megabyte begrenzt und synchron — bei größeren Listen mit Beispielsätzen ein realistisches Limit und ein Risiko für Ruckler beim Wischen. IndexedDB ist asynchron, deutlich größer dimensioniert und erlaubt getrennte Stores für Listen und Fortschritt.

**Trade-off:** IndexedDB ist umständlicher in der Nutzung. Abgefedert durch eine dünne Wrapper-Schicht (z.B. `idb`), die den Rest der App von der Low-Level-API abschirmt.

**Alternativen:** `localStorage` — einfacher, aber das Größenlimit kollidiert mit dem Import beliebiger Nutzerlisten.

### Entscheidung 4: Stabile Wort-Identität aus dem Wortpaar ableiten

Der Fortschrittseintrag eines Wortes wird über einen aus Wort A und Wort B abgeleiteten, normalisierten Schlüssel adressiert — nicht über die Zeilennummer im Import.

**Warum:** Die Anforderung "Fortschritt nach erneutem Import erhalten" in `learning-progress` lässt sich nur erfüllen, wenn die Identität unabhängig von Reihenfolge und Position in der Datei ist. Beispielsätze gehen nicht in den Schlüssel ein, damit ein nachträglich ergänztes Beispiel den Fortschritt nicht entwertet.

**Alternativen:**

- *Index in der Liste*: Bricht, sobald der Nutzer Zeilen einfügt oder sortiert.
- *ID-Spalte in der Datei verlangen*: Belastet den Nutzer beim Pflegen der Listen.

### Entscheidung 5: Getrennte Fortschrittseinträge je Richtung

Der Fortschritt wird unter dem Schlüsselpaar (Wort-Schlüssel, Richtung) geführt, nicht als ein Eintrag je Wort.

**Warum:** `learning-progress` fordert unabhängige Zählung je Richtung. Zwei getrennte Einträge machen das strukturell unmöglich zu verwechseln, statt es in Abfragelogik zu verstecken.

### Entscheidung 6: CSV-Parsing mit Bibliothek, nicht selbstgebaut

CSV wird mit einer etablierten Bibliothek (z.B. PapaParse) gelesen.

**Warum:** Anführungszeichen, eingebettete Trennzeichen, Zeilenumbrüche in Feldern und BOM sind in handgeschriebenen Parsern die üblichen Fehlerquellen. Da Beispielsätze Kommas enthalten werden, tritt genau dieser Fall regelmäßig auf.

**Format:** Kopfzeile erforderlich. Spalten für Sprache A und Sprache B; Beispiele in Spaltenpaaren (`beispiel_a_1`, `beispiel_b_1`, `beispiel_a_2`, …). Das exakte Schema beider Formate wird als Beispieldatei im Repository dokumentiert.

### Entscheidung 7: Import validiert gegen ein Schema und meldet Zeilen einzeln

Beide Importpfade münden in dieselbe Validierung, die je Eintrag entscheidet und fehlerhafte Einträge mit Positionsangabe sammelt.

**Warum:** Die Specs verlangen Teilimport mit Zeilenmeldung (CSV) und Totalablehnung bei kaputter Datei (JSON). Ein gemeinsamer Validierungsschritt hinter zwei Parsern erfüllt beides, ohne die Regeln zu duplizieren.

**Sicherheit:** Importierte Dateien sind nicht vertrauenswürdige Eingaben. Inhalte werden ausschließlich als Text gerendert, niemals als HTML interpretiert. Es gibt keine Auswertung von Dateiinhalten als Code.

### Entscheidung 8: Swipe-Gesten über Pointer Events, keine Gesten-Bibliothek

Wischen, langer Druck und Doppeltipp werden über Pointer Events mit Schwellenwerten für Distanz und Dauer umgesetzt; die Karte folgt dem Finger über CSS-Transforms.

**Warum:** Pointer Events decken Touch und Maus einheitlich ab, was das Testen am Desktop ermöglicht. Der Gestenbedarf ist klein und klar abgegrenzt; eine Bibliothek würde für drei Gesten eine Abhängigkeit mit eigener Lernkurve einführen.

**Trade-off:** Schwellenwerte (Wischdistanz, 500 ms für langen Druck, Doppeltipp-Fenster) müssen am Gerät justiert werden. Sie werden als benannte Konstanten an einer Stelle gehalten.

**Konfliktauflösung:** Langer Druck und Wischen schließen sich aus — sobald die Bewegung die Wischschwelle überschreitet, wird der Lange-Druck-Timer verworfen. Ein Doppeltipp zählt nur, wenn beide Tipps ohne nennenswerte Bewegung erfolgen.

### Entscheidung 9: Service Worker über vite-plugin-pwa

Manifest und Service Worker werden generiert statt von Hand geschrieben; Precaching der App-Shell, Update über Prompt beim nächsten Start.

**Warum:** Ein handgeschriebener Service Worker mit korrektem Update- und Cache-Invalidierungsverhalten ist eine bekannte Fehlerquelle (festhängende alte Versionen). Die Nutzerdaten liegen ohnehin in IndexedDB und sind vom Shell-Cache unberührt — Updates können den Cache gefahrlos ersetzen.

### Entscheidung 10: Kartenauswahl in zufälliger Reihenfolge je Durchgang

Ein Durchgang enthält alle in dieser Richtung offenen Wörter, gemischt. Falsch beantwortete Wörter kommen im selben Durchgang nicht erneut.

**Warum:** Mischen verhindert, dass die Listenreihenfolge mitgelernt wird. Kein Wiedervorlegen im selben Durchgang hält die Sitzung endlich und die Zusammenfassung aussagekräftig.

**Alternative:** Falsche Wörter ans Ende anhängen — verlängert die Sitzung unvorhersehbar und steht im Konflikt mit der Spec "Sitzung endet, wenn alle Karten bewertet wurden".

### Entscheidung 11: Vitest als Testrunner

**Warum:** Teilt die Vite-Konfiguration, sodass kein zweites Build-Setup gepflegt werden muss. Deckt die reinen Logikmodule ab, die den Testschwerpunkt bilden.

## Risks / Trade-offs

- **Schwellenwerte für Gesten fühlen sich auf echten Geräten falsch an** → Als benannte Konstanten an einer Stelle halten; auf einem echten Handy prüfen, bevor die Oberfläche als fertig gilt.
- **Langer Druck kollidiert mit dem Kontextmenü des Browsers** → Kontextmenü und Textauswahl auf der Karte unterbinden; auf iOS Safari und Android Chrome gegenprüfen.
- **IndexedDB ist im privaten Modus eingeschränkt oder wird vom System geleert** → Fehlerfall sichtbar melden (Spec `learning-progress`), Sitzung bleibt im Speicher bedienbar. Export/Import des Fortschritts ist eine mögliche spätere Absicherung, aber nicht in diesem Scope.
- **Ableitung des Wort-Schlüssels aus dem Wortpaar kollidiert bei Homonymen** → Bei doppeltem Schlüssel innerhalb einer Liste den zweiten Eintrag als Duplikat melden, statt den Fortschritt still zu teilen.
- **Service Worker liefert nach einem Update die alte Version aus** → Generierte Konfiguration statt Handarbeit; Update-Verhalten nach dem ersten Deployment einmal bewusst durchspielen.
- **Beispiel-Wortlisten im Repository veralten gegenüber dem Importformat** → Die mitgelieferte Beispiel-JSON und -CSV in die Tests des Importers aufnehmen, damit ein Formatbruch auffällt.

## Migration Plan

Entfällt — Greenfield, keine Bestandsdaten und keine laufende Installation.

## Open Questions

- Wo wird die App gehostet (GitHub Pages, anderer Static Host, oder nur lokal im Netz)? Betrifft nur die Basis-URL der Build-Konfiguration und kann nach der Implementierung entschieden werden.
- Soll es später Export/Import des Lernfortschritts geben? Außerhalb dieses Scopes; die getrennte Speicherung von Listen und Fortschritt hält die Option offen.
