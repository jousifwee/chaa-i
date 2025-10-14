# chaa-i Routing Server (Node.js)

Ein minimaler Node.js/TypeScript‑WebSocket‑Server für P2P‑ und Gruppen‑Routing.

## Quick Start

1) Abhängigkeiten installieren

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

Optional: Port ändern (PowerShell)
```
$env:PORT=9090; npm run dev
```

## Gehostete Web‑App
- Index: `http://localhost:8080/app`
- Verschlüsselter Client: `http://localhost:8080/app/secure`
- Einfacher Client: `http://localhost:8080/app/simple`

Die HTML‑Dateien liegen in `client_secure/` und `client_simple/` und werden direkt vom Server ausgeliefert.

## Protokoll‑Erwartung
- `type: 'join'` mit `{ userId: string, rooms?: string[] }`
- `type: 'msg'` mit `{ to?: string, room?: string, ...cipher-metadata }`
- `type: 'leave'` mit `{ rooms?: string[] }`

Der Server validiert minimal und routet nur. Payload bleibt Ciphertext (siehe `docs/PROTOKOLL.md`).

## Status schnell prüfen
- Datei `servers-status.http` im Repo öffnen und Requests senden.

## Skalierung
- Hinter einen Load Balancer mit Sticky Sessions stellen oder Redis Pub/Sub integrieren.

