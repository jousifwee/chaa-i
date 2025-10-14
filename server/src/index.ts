import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

type ClientId = string;
type RoomId = string;

const server = http.createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('chaa-i routing server running');
    return;
  }
  res.writeHead(404).end();
});

const wss = new WebSocketServer({ noServer: true });

const clients = new Map<ClientId, WebSocket>();
const rooms = new Map<RoomId, Set<ClientId>>();

server.on('upgrade', (req, socket, head) => {
  if (!req.url?.startsWith('/ws')) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

wss.on('connection', (ws) => {
  let userId: ClientId | '' = '';

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(String(raw));
      switch (msg.type) {
        case 'join': {
          if (typeof msg.userId !== 'string' || !msg.userId) return;
          userId = msg.userId;
          clients.set(userId, ws);
          const joinRooms: string[] = Array.isArray(msg.rooms) ? msg.rooms : [];
          for (const r of joinRooms) {
            if (!rooms.has(r)) rooms.set(r, new Set());
            rooms.get(r)!.add(userId);
          }
          // presence (optional)
          break;
        }
        case 'msg': {
          // Relay only; payload is ciphertext. Expect either `to` or `room`.
          if (msg.to && typeof msg.to === 'string') {
            clients.get(msg.to)?.send(JSON.stringify(msg));
          } else if (msg.room && typeof msg.room === 'string') {
            const members = rooms.get(msg.room);
            if (members) {
              for (const u of members) {
                if (u !== userId) clients.get(u)?.send(JSON.stringify(msg));
              }
            }
          }
          break;
        }
        case 'leave': {
          const leaveRooms: string[] = Array.isArray(msg.rooms) ? msg.rooms : [];
          for (const r of leaveRooms) rooms.get(r)?.delete(userId);
          break;
        }
        default:
          // ignore unknown
          break;
      }
    } catch {
      // ignore parse errors
    }
  });

  ws.on('close', () => {
    if (userId) {
      clients.delete(userId);
      for (const s of rooms.values()) s.delete(userId);
    }
  });
});

const PORT = Number(process.env.PORT || 8080);
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`chaa-i server listening on http://localhost:${PORT}`);
});

