# chaa-i Routing Server (MVP)

Ein minimaler Node.js/TypeScript-WebSocket-Server für P2P- und Gruppen-Routing.

## Quick Start

1) Abhängigkeiten installieren

```
cd server
npm install
```

2) Entwicklung

```
npm run dev
# → http://localhost:8080 , WebSocket unter ws://localhost:8080/ws
```

3) Produktion

```
npm run build
npm start
```

## Protokoll-Erwartung
- `type: 'join'` mit `{ userId: string, rooms?: string[] }`
- `type: 'msg'` mit `{ to?: string, room?: string, ...cipher-metadata }`
- `type: 'leave'` mit `{ rooms?: string[] }`

Der Server validiert/nachrichtet minimal und routet nur. Payload bleibt Ciphertext (siehe `docs/PROTOKOLL.md`).

## Skalierung
- Hinter einen Load Balancer mit Sticky Sessions stellen, oder Redis Pub/Sub integrieren.

