# 🛴 ScooterSpotter – E-Scooter-Spotting

Fotografiere E-Scooter, lass sie per KI erkennen und bau deine Sammlung auf.

## Funktionen
- **Scannen:** Foto aufnehmen oder hochladen → die KI (Claude) analysiert Rahmen, Lenker, Räder, Logos usw. und bestimmt **Marke und Modell** inkl. Sicherheit in %, erkannten Merkmalen und Alternativen.
- **Korrigieren:** Liegt die KI falsch, wählst du die richtige Marke/das richtige Modell aus – oder trägst eine neue Marke bzw. ein neues Modell ein (wird automatisch zum Katalog hinzugefügt).
- **Meine Spots:** Alle gespotteten Scooter mit Foto, Datum und Ort; nachträglich bearbeiten oder löschen.
- **Katalog:** 40 Marken mit über 220 Modellen (Privat-Scooter wie Xiaomi, Segway-Ninebot, NIU, Dualtron … und Sharing wie Lime, TIER, Voi, Bolt, Dott …). Zeigt pro Marke, wie viele Modelle du schon gespottet hast.
- **Statistik:** Spots gesamt, verschiedene Modelle, Spots pro Marke, Top-Modelle, Privat vs. Sharing und wie oft die KI richtig lag.
- **Backup:** Export/Import als JSON.

## Starten
Reine statische Website, kein Build nötig. Wegen der JavaScript-Module muss sie über einen Webserver laufen (nicht per Doppelklick als Datei):

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

Oder per **GitHub Pages** veröffentlichen (Settings → Pages → Branch auswählen).
Für die Kamera auf dem Handy muss die Seite über HTTPS laufen (GitHub Pages macht das automatisch).

## KI einrichten
**Ohne API-Key:** Läuft die Seite als Claude-Artifact auf claude.ai, nutzt die KI automatisch dein Claude-Konto (beim ersten Scan fragt Claude um Erlaubnis).

**Mit API-Key (z. B. auf GitHub Pages):**
In den Einstellungen (⚙️) einen Claude-API-Key von [console.anthropic.com](https://console.anthropic.com/) eintragen.
Der Key bleibt nur in deinem Browser (localStorage) und wird direkt an die Claude-API geschickt.
Ohne Key kannst du Scooter trotzdem manuell auswählen.

> Hinweis: Da der Key im Browser liegt, ist das für die private Nutzung gedacht. Für eine öffentliche Website mit vielen Nutzern sollte die KI-Anfrage über einen eigenen Server laufen.

## Daten
Spots werden lokal im Browser (IndexedDB) gespeichert. Regelmäßig ein Backup exportieren!

## Dateien
- `index.html` – Oberfläche
- `css/style.css` – Design
- `js/catalog.js` – Katalog aller Marken und Modelle (hier kannst du weitere eintragen)
- `js/ai.js` – KI-Erkennung über die Claude-API (API-Key)
- `js/claude-account.js` – KI-Erkennung über das Claude-Konto (im Artifact)
- `js/prompt.js` – Anweisung an die KI
- `js/app.js` – App-Logik
- `js/db.js`, `js/settings.js` – Speicherung
