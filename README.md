# chaa-i
chaa-i - ein verschluesselnder Kommunikator (Web-App, E2EE)

## Architektur & Dokumentation
- `docs/ARCHITEKTUR.md`
- `docs/SERVER_ALTERNATIVEN.md`
- `docs/FRONTEND_FRAMEWORKS.md`
- `docs/KRYPTO.md`
- `docs/PROTOKOLL.md`
- `docs/CLIENT_WEBAPP.md`
- `docs/SERVER.md`
- `docs/P2P_WEBRTC.md`
- `docs/GRUPPENCHAT.md`
- `docs/THREAT_MODEL.md`
- `docs/ROADMAP.md`

MVP: Passphrase -> SHA-256 -> AES-256-GCM; der Server routet, Client verschluesselt/entschluesselt im Browser.

## Schnellstart
- Node-Server: `cd server && npm install && npm run dev` -> WebSocket `ws://localhost:8080/ws`
- Spring-Server: `cd server_spring && mvn spring-boot:run` -> WebSocket `ws://localhost:8081/ws`

## Web-Clients
- Einfacher Client (Klartext, Test):
  - Lokaldatei: `client_simple/index.html`
  - Gehostet (Node): `http://localhost:8080/app/simple`
  - Gehostet (Spring): `http://localhost:8081/app/simple/`
- Sicherer Client (AES-256-GCM, Passphrase -> SHA-256):
  - Lokaldatei: `client_secure/index.html`
  - Gehostet (Node): `http://localhost:8080/app/secure`
  - Gehostet (Spring): `http://localhost:8081/app/secure/`
- Svelte Client (SPA): `client_svelte/` – gehostet unter `/app/svelte`
- Angular Client (Material): `client_angular/` – gehostet unter `/app/angular`

Hinweise zum Secure-Client:
- AAD bindet `{ v, alg, from, to|room, ts }`.
- Passphrase ist waehrend der Sitzung aenderbar (Key-Ring im RAM fuer Alt-Nachrichten).

## Status pruefen
- Datei: `servers-status.http` (VS Code REST Client / IntelliJ HTTP Client)
- Requests: `GET http://localhost:8080/` und `GET http://localhost:8081/`

## Svelte Client
- Quelle: `client_svelte/` (Svelte + Vite)
- Entwickeln: `cd client_svelte && npm install && npm run dev` -> `http://localhost:5173`
- Build: `npm run build` -> Ergebnisse in `client_svelte/dist/`
- Hosting:
  - Node: `http://localhost:8080/app/svelte` (nutzt `client_svelte/dist/` oder `server/public/app/svelte`)
  - Spring: Dateien nach `server_spring/src/main/resources/static/app/svelte/` kopieren -> `http://localhost:8081/app/svelte/`
- Sync-Skripte (`client_svelte/scripts/`):
  - `sync-to-node.ps1` / `sync-to-node.sh` kopieren nach `server/public/app/svelte`
  - `sync-to-spring.ps1` / `sync-to-spring.sh` kopieren nach `server_spring/src/main/resources/static/app/svelte/`

## Angular Client
- Quelle: `client_angular/` (Angular + Material)
- Entwickeln: `cd client_angular && npm install && npm start` -> `http://localhost:4200`
- Build: `npm run build` -> Ergebnisse in `client_angular/dist/chaa-i-client-angular/`
- Hosting:
  - Node: `http://localhost:8080/app/angular` (nutzt Build oder `server/public/app/angular`)
  - Spring: Dateien nach `server_spring/src/main/resources/static/app/angular/` kopieren -> `http://localhost:8081/app/angular/`
- Sync-Skripte (`client_angular/scripts/`):
  - `sync-to-node.ps1` / `sync-to-node.sh`
  - `sync-to-spring.ps1` / `sync-to-spring.sh`

