# chaa-i Routing Server (Node.js)

Minimaler Node.js/TypeScript-WebSocket-Server fuer P2P- und Gruppen-Routing.

## Quick Start

1) Abhaengigkeiten installieren

```
cd server
npm install
```

2) Entwicklung

```
npm run dev
# HTTP: http://localhost:8080  |  WS: ws://localhost:8080/ws
```

3) Produktion

```
npm run build
npm start
```

Optionaler Portwechsel (PowerShell):

```
$env:PORT=9090; npm run dev
```

## Gehostete Web-App
- Index: `http://localhost:8080/app`
- Verschluesselter Client: `http://localhost:8080/app/secure`
- Einfacher Client: `http://localhost:8080/app/simple`
- Svelte Client: `http://localhost:8080/app/svelte`
- Angular Client: `http://localhost:8080/app/angular`

Statische Dateien:
- `client_secure/` und `client_simple/` werden direkt gelesen
- Svelte-Build wird aus `client_svelte/dist/` oder `server/public/app/svelte/` bedient
- Angular-Build wird aus `client_angular/dist/chaa-i-client-angular/` oder `server/public/app/angular/` bedient

## Sync-Skripte
- `client_svelte/scripts/sync-to-node.(ps1|sh)` → `server/public/app/svelte/`
- `client_angular/scripts/sync-to-node.(ps1|sh)` → `server/public/app/angular/`

## Protokoll-Erwartung
- `type: 'join'` mit `{ userId: string, rooms?: string[] }`
- `type: 'msg'` mit `{ to?: string, room?: string, ...cipher-metadata }`
- `type: 'leave'` mit `{ rooms?: string[] }`

Der Server validiert minimal und routet nur. Payload bleibt Ciphertext (siehe `docs/PROTOKOLL.md`).

## Status schnell pruefen
- Datei `servers-status.http` oeffnen und Requests senden.

## Skalierung
- Hinter einen Load Balancer mit Sticky Sessions stellen oder Redis Pub/Sub integrieren.

