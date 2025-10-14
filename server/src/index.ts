import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

type ClientId = string;
type RoomId = string;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const clientSecurePath = path.join(repoRoot, 'client_secure', 'index.html');
const clientSimplePath = path.join(repoRoot, 'client_simple', 'index.html');
const svelteCandidateDirs = [
  path.join(repoRoot, 'client_svelte', 'dist'),
  path.join(repoRoot, 'server', 'public', 'app', 'svelte')
];

function serveHtmlFile(filePath: string, res: http.ServerResponse) {
  try {
    const html = fs.readFileSync(filePath);
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store'
    });
    res.end(html);
  } catch {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end('500 Internal Server Error');
  }
}

function serveAppIndex(res: http.ServerResponse, port: number) {
  const html = `<!doctype html>
<html lang="de"><meta charset="utf-8"><title>chaa-i - WebApp</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<body style="font-family:system-ui;margin:24px;line-height:1.35">
<h1>chaa-i - WebApp</h1>
<p>Dieser Server hostet die Web-Clients:</p>
<ul>
  <li><a href="/app/secure/">Verschluesselter Client (AES-256-GCM)</a></li>
  <li><a href="/app/simple/">Einfacher Klartext-Client</a></li>
  <li><a href="/app/svelte/">Svelte Client (Klartext + AES-256-GCM)</a></li>
  <li><a href="/">Status</a> (Text)</li>
  <li>WebSocket: <code>ws://localhost:${port}/ws</code></li>
</ul>
</body></html>`;
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(html);
}

function guessContentType(p: string): string {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  if (p.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (p.endsWith('.css')) return 'text/css; charset=utf-8';
  if (p.endsWith('.map')) return 'application/json; charset=utf-8';
  if (p.endsWith('.svg')) return 'image/svg+xml';
  if (p.endsWith('.json')) return 'application/json; charset=utf-8';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

function resolveSvelteFile(subPath: string): string | null {
  const sanitized = subPath.split('?')[0].split('#')[0];
  for (const base of svelteCandidateDirs) {
    const normalizedBase = path.normalize(base);
    if (!fs.existsSync(normalizedBase)) continue;
    const fsPath = path.normalize(path.join(normalizedBase, sanitized));
    if (!fsPath.startsWith(normalizedBase)) continue;
    try {
      const stat = fs.statSync(fsPath);
      if (stat.isFile()) return fsPath;
      if (stat.isDirectory()) {
        const idx = path.join(fsPath, 'index.html');
        if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return idx;
      }
    } catch {
      // ignore and continue
    }
  }
  return null;
}

function serveSvelte(reqUrl: string, res: http.ServerResponse) {
  const base = '/app/svelte';
  let sub = reqUrl.slice(base.length);
  if (!sub || sub === '/') sub = '/index.html';
  const filePath = resolveSvelteFile(sub);
  if (filePath) {
    try {
      const buf = fs.readFileSync(filePath);
      res.writeHead(200, { 'content-type': guessContentType(filePath), 'cache-control': 'no-store' });
      res.end(buf);
      return;
    } catch {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end('500 Internal Server Error');
      return;
    }
  }

  const hints = svelteCandidateDirs
    .map((dir) => {
      const exists = fs.existsSync(dir);
      return `<li><code>${dir}</code> ${exists ? '(gefunden)' : '(fehlt)'}</li>`;
    })
    .join('');
  const html = `<!doctype html><meta charset="utf-8"><title>chaa-i - Svelte</title><body style="font-family:system-ui;margin:24px"><h1>Svelte Build fehlt</h1><p>Bitte im Ordner <code>client_svelte</code> <code>npm install</code> und <code>npm run build</code> ausfuehren. Danach optional <code>./scripts/sync-to-node.(ps1|sh)</code> verwenden.</p><p>Gesuchte Pfade:</p><ul>${hints}</ul></body>`;
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    if (req.url === '/') {
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
      res.end('chaa-i routing server running');
      return;
    }
    if (req.url === '/app' || req.url === '/app/') {
      const port = Number(process.env.PORT || 8080);
      serveAppIndex(res, port);
      return;
    }
    if (req.url === '/app/secure' || req.url === '/app/secure/') {
      serveHtmlFile(clientSecurePath, res);
      return;
    }
    if (req.url === '/app/simple' || req.url === '/app/simple/') {
      serveHtmlFile(clientSimplePath, res);
      return;
    }
    if (req.url?.startsWith('/app/svelte')) {
      serveSvelte(req.url, res);
      return;
    }
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
          break;
        }
        case 'msg': {
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
          break;
      }
    } catch {
      // ignore parse errors
    }
  });

  ws.on('close', () => {
    if (userId) {
      clients.delete(userId);
      for (const set of rooms.values()) set.delete(userId);
    }
  });
});

const PORT = Number(process.env.PORT || 8080);
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`chaa-i server listening on http://localhost:${PORT}`);
});
