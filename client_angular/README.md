# chaa-i Angular Client

Angular (Standalone, Material) WebApp mit optionaler AES-256-GCM Verschluesselung analog zu den bestehenden Clients.

## Voraussetzungen
- Node.js 18+
- Angular CLI global optional (`npm install -g @angular/cli`)

## Entwicklung
```
cd client_angular
npm install
npm start
# → http://localhost:4200
```

## Produktion / Build
```
npm run build
# Ausgabe: client_angular/dist/chaa-i-client-angular/
```

## Hosting in den Servern
- Node: `http://localhost:8080/app/angular/`
  - Server liest entweder `client_angular/dist/chaa-i-client-angular/` oder `server/public/app/angular/`
  - Sync-Skripte (`client_angular/scripts/`):
    - `sync-to-node.ps1` / `sync-to-node.sh`
- Spring: `http://localhost:8081/app/angular/`
  - Dateien nach `server_spring/src/main/resources/static/app/angular/` kopieren
  - Sync-Skripte: `sync-to-spring.ps1` / `sync-to-spring.sh`

## Features
- Konfiguration (Server-URL, Username, Rooms, Passphrase, Klartextmodus) im Browser lokal gespeichert
- Umschaltbare AES-256-GCM Verschluesselung (Passphrase → SHA-256)
- WebSocket Log mit Statusanzeigen, analog zum Svelte-Client

