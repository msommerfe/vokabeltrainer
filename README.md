# Vokabeltrainer

Karteikarten-Trainer für eigene Vokabellisten. Installierbare PWA, offline nutzbar, Bedienung per Swipe auf dem Handy.

- Swipe nach **rechts** = Wort gewusst
- Swipe nach **links** = Wort nicht gewusst
- **Berühren** zeigt die Übersetzung samt Beispielen, solange der Finger auf der Karte liegt
- **Doppeltipp** hält die Übersetzung bis zur nächsten Karte sichtbar
- Ein Wort gilt nach **3× in Folge gewusst** als gelernt und fällt sofort aus der Abfrage
- Eine Sitzung umfasst **alle offenen Wörter**. Die Karten werden zufällig gezogen; ein Wort kann wiederkommen, bevor alle anderen dran waren, aber nicht direkt hintereinander
- Die Sitzung läuft, bis alle Wörter gelernt sind oder sie mit **Beenden** abgeschlossen wird
- Jede Bewertung wird sofort gespeichert — ein Abbruch mitten in der Sitzung verliert nichts
- Abfrage in beide Richtungen, Fortschritt je Richtung getrennt
- Zusätzlich **Übungen** je Liste: Lückentexte (Berühren zeigt die Lösung, Wischen bewertet) und Auswahlfragen A/B/C (Antippen wertet sofort aus), jeweils mit kurzer Erklärung. Eine Übung gilt nach einmal richtig als gelöst

Alle Daten bleiben auf dem Gerät. Es gibt kein Backend und keine Übertragung an Dritte.

## Mitgelieferte Wortlisten

Beim ersten Start stehen drei Listen mit je 100 Einträgen bereit:

| Liste | Inhalt |
| --- | --- |
| Spanisch Grundwortschatz | Häufigste Verben, Pronomen, Frageworte, Zahlen, Grundbegriffe |
| Spanisch Alltagswörter | Essen, Wohnen, Einkaufen, Verkehr, Zeitangaben |
| Spanisch Aufbauwortschatz | Körper, Gefühle, Natur, Arbeit, weiterführende Verben und Adjektive |

Jeder Eintrag hat mindestens ein einfaches Beispiel. Bei Verben zeigt ein zusätzliches Beispiel die sechs Präsensformen, etwa bei `venir`:

```
vengo · vienes · viene · venimos · venís · vienen
ich komme · du kommst · er/sie kommt · wir kommen · ihr kommt · sie kommen
```

Jede Liste ist in **beide Richtungen** abfragbar — Spanisch → Deutsch und Deutsch → Spanisch erscheinen als zwei Kacheln. Separate Listen je Richtung sind nicht nötig, weil der Fortschritt ohnehin je Richtung getrennt gezählt wird.
Als dritte Kachel bietet jede Liste **Übungen** an: je 10 Lückentexte und 10 Auswahlfragen zu Grammatik und Wortschatz der Liste, jeweils mit Erklärung. „Vokabeln zurücksetzen“ und „Übungen zurücksetzen“ wirken unabhängig voneinander.

Ändern sich die mitgelieferten Listen mit einer neuen App-Version, werden sie in bestehenden Installationen beim nächsten Start aktualisiert. Der Fortschritt unveränderter Wörter und Übungen bleibt erhalten. Eine gelöschte mitgelieferte Liste wird nicht wieder angelegt. Wer die Dateien unter `public/samples/` ändert, erhöht `SAMPLES_VERSION` in [src/app/samples.ts](src/app/samples.ts), damit bestehende Installationen die Änderung übernehmen.
## Entwicklung

```powershell
npm install
npm run dev      # Dev-Server auf http://localhost:5173/
npm test         # Unit-Tests
npm run build    # Typprüfung + Produktions-Build nach dist/
npm run preview  # Produktions-Build lokal ausliefern
```

Die App-Icons liegen unter `public/icons/` und werden von `node scripts/generate-icons.mjs` erzeugt. Das Skript muss nur laufen, wenn die Icons geändert werden sollen.

## Deployment

`npm run build` erzeugt in `dist/` ausschließlich statische Dateien. Es gibt keine Serverlogik — jeder Static Host genügt.

Zwei Dinge sind zu beachten:

- **HTTPS ist erforderlich.** Service Worker laufen nur über HTTPS oder auf `localhost`. Ohne HTTPS ist die App weder installierbar noch offline nutzbar.
- **Unterverzeichnisse funktionieren out of the box.** `base` steht in [vite.config.ts](vite.config.ts) auf `'./'`, die Pfade sind also relativ. Die App läuft sowohl unter `https://example.com/` als auch unter `https://example.com/vokabeln/`.

Zum Testen im Heimnetz (Handy im selben WLAN):

```powershell
npm run build
npm run preview -- --host
```

Der Zugriff über die angezeigte Netzwerkadresse ist für einen Funktionstest ausreichend. Installation auf dem Homescreen und Offline-Betrieb erfordern jedoch HTTPS und funktionieren über `http://192.168.x.x` nicht.

### Updates

Eine neue Version wird nicht still übernommen: Die App zeigt den Hinweis „Eine neue Version ist verfügbar“ mit einer Schaltfläche zum Aktualisieren. Importierte Listen und Lernfortschritt liegen in IndexedDB und sind vom Update nicht betroffen.

## Wortlisten bereitstellen

Eigene Listen lassen sich als JSON oder CSV importieren. Die drei mitgelieferten Listen liegen als Formatvorlage unter [public/samples](public/samples).

### JSON

`name`, `languageA` und `languageB` sind optional. Fehlen die Sprachbezeichnungen, nutzt die App "Sprache A" und "Sprache B". Fehlt der Name, wird der Dateiname verwendet.

```json
{
  "name": "Grundwortschatz Deutsch–Englisch",
  "languageA": "Deutsch",
  "languageB": "Englisch",
  "entries": [
    {
      "wordA": "das Haus",
      "wordB": "the house",
      "examples": [
        { "sentenceA": "Das Haus ist sehr alt.", "sentenceB": "The house is very old." }
      ]
    },
    { "wordA": "das Brot", "wordB": "the bread" }
  ]
}
```

Eine syntaktisch ungültige JSON-Datei wird vollständig abgelehnt. Einzelne Einträge ohne `wordA` oder `wordB` werden übersprungen und mit ihrer Position gemeldet.

### Übungen

Eine JSON-Liste kann zusätzlich den optionalen Block `exercises` enthalten. Dann erscheint in der Übersicht neben den beiden Abfragerichtungen die Kachel **Übungen**.

```json
{
  "name": "Spanisch Verben",
  "languageA": "Spanisch",
  "languageB": "Deutsch",
  "entries": [
    { "wordA": "hablar", "wordB": "sprechen" }
  ],
  "exercises": [
    {
      "type": "gap",
      "sentence": "Yo {hablo} español y tú {hablas} alemán.",
      "explanation": "hablar im Präsens: yo hablo, tú hablas."
    },
    {
      "type": "choice",
      "question": "Nosotros ___ en Madrid.",
      "options": ["vivo", "vivimos", "viven"],
      "answer": "vivimos",
      "explanation": "nosotros → Endung -imos bei Verben auf -ir."
    }
  ]
}
```

- **Lückentext** (`"type": "gap"`): Die fehlenden Wörter stehen in geschweiften Klammern im Satz. Mehrere Lücken sind möglich. In der App zeigt Berühren die Lösung und die Erklärung, Loslassen verbirgt sie, ein Doppeltipp hält sie fest. Die Bewertung erfolgt per Wischen.
- **Auswahlfrage** (`"type": "choice"`): mindestens zwei `options`. `answer` muss genau einer Option entsprechen. Die Optionen erscheinen in der Reihenfolge der Datei als A, B, C … Nach dem Antippen zeigt die App sofort, ob die Antwort richtig war.
- `explanation` ist optional und wird nach dem Aufdecken bzw. Beantworten angezeigt.
- Eine Übung gilt nach **einmal richtig** als gelöst. Der Übungsfortschritt ist vom Vokabelfortschritt getrennt und lässt sich separat zurücksetzen.
- Fehlerhafte Übungen werden übersprungen und als „Übung N“ gemeldet; die übrigen Inhalte werden trotzdem importiert. Beim erneuten Import bleibt der Fortschritt einer Übung erhalten, solange Satz bzw. Frage und richtige Antwort gleich bleiben. Eine geänderte Erklärung oder ausgetauschte falsche Antworten setzen ihn nicht zurück.
- Übungen gibt es nur im JSON-Format, nicht im CSV-Import.

### CSV

Eine Kopfzeile ist erforderlich. Die ersten beiden Spalten sind Sprache A und Sprache B; ihre Überschriften dienen zugleich als Sprachbezeichnung.

```csv
Deutsch,Englisch,beispiel_a_1,beispiel_b_1,beispiel_a_2,beispiel_b_2
der Apfel,the apple,Ich esse einen Apfel.,I am eating an apple.,,
das Brot,the bread,,,,
```

- Beispiele stehen in Spaltenpaaren `beispiel_a_N` / `beispiel_b_N` (alternativ `example_a_N` / `example_b_N`). Nur vollständige Paare werden übernommen.
- Enthält ein Feld ein Komma, muss es in Anführungszeichen stehen: `"Der Apfel ist rot, saftig und süß."`
- Statt sprechender Überschriften sind auch die generischen Namen `wort_a` / `wort_b` möglich. Dann nutzt die App die neutralen Sprachbezeichnungen.
- Unvollständige Zeilen werden übersprungen und mit ihrer Zeilennummer gemeldet. Enthält die Datei keine einzige gültige Zeile, wird sie abgelehnt.

Doppelte Wortpaare innerhalb einer Liste werden erkannt: Der erste Eintrag wird übernommen, jeder weitere mit gleichem Wortpaar als Duplikat gemeldet.

## Projektstruktur

| Pfad | Inhalt |
| --- | --- |
| `src/domain/` | Lernlogik ohne UI-Abhängigkeiten (Streak, Gelernt-Kriterium, Kartenauswahl) |
| `src/import/` | Validierung und Importer für JSON und CSV |
| `src/storage/` | Persistenz in IndexedDB |
| `src/ui/` | React-Oberfläche und Gestensteuerung |
| `public/samples/` | Mitgelieferte Beispiellisten |
| `openspec/` | Specs, Design und Tasks des Projekts |
