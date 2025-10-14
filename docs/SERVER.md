# Routing-Server (MVP)

## Ziele
- WebSocket-Endpunkt (`/ws`) für Clients (eine Session je Client)
- User-/Room-Registrierung, Präsenz, Routing P2P/Broadcast
- Keine Einsicht in Klartexte (nur Metadaten)

## Technologie
- Node.js + TypeScript
- Framework: Fastify oder Express
- WebSocket: `ws`
- Skalierung: optional Redis Pub/Sub (Channels pro Room, Direktnachrichten über dedizierte Channels)

## Nachrichtenfluss
- `join`: Client meldet `userId` und optionale `rooms`. Server hält Präsenz.
- `msg`: Server verifiziert Routingfelder (`to` XOR `room`) und verteilt an Ziel(e).
- `leave`/Disconnect: Präsenz aktualisieren; Rooms verlassen.

## Beispiel (Pseudo‑TS)
```ts
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });
const clients = new Map<string, WebSocket>();
const rooms = new Map<string, Set<string>>();

wss.on('connection', (ws) => {
  let userId = '';
  ws.on('message', (raw) => {
    const msg = JSON.parse(String(raw));
    switch (msg.type) {
      case 'join': {
        userId = msg.userId;
        clients.set(userId, ws);
        for (const r of msg.rooms ?? []) {
          if (!rooms.has(r)) rooms.set(r, new Set());
          rooms.get(r)!.add(userId);
        }
        break;
      }
      case 'msg': {
        if (msg.to) {
          clients.get(msg.to)?.send(JSON.stringify(msg));
        } else if (msg.room) {
          for (const u of rooms.get(msg.room) ?? []) {
            if (u !== userId) clients.get(u)?.send(JSON.stringify(msg));
          }
        }
        break;
      }
      case 'leave': {
        for (const r of msg.rooms ?? []) rooms.get(r)?.delete(userId);
        break;
      }
    }
  });
  ws.on('close', () => {
    clients.delete(userId);
    for (const s of rooms.values()) s.delete(userId);
  });
});
```

## Sicherheit/Hardening
- Rate-Limiting pro Verbindung; Maxgröße pro Nachricht
- Logging nur Metadaten; PII minimieren
- Sticky Sessions hinter Load-Balancer oder Redis-Broker

