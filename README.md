# chaa-i
chaa-i – ein verschlüsselnder Kommunikator (Web‑App, E2EE)

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

MVP: Passphrase → SHA‑256 → AES‑256‑GCM; WebSocket‑Server routet, Client verschlüsselt/entschlüsselt im Browser.

## Schnellstart
- Node‑Server starten: `cd server && npm i && npm run dev` → WebSocket `ws://localhost:8080/ws`
- Spring‑Server starten: `cd server_spring && mvn spring-boot:run` → WebSocket `ws://localhost:8081/ws`

## Web‑Clients
- Einfacher Client (Klartext, Test):
  - Lokaldatei: `client_simple/index.html`
  - Gehostet (Node): `http://localhost:8080/app/simple`
  - Gehostet (Spring): `http://localhost:8081/app/simple/`
- Sicherer Client (AES‑256‑GCM, Passphrase→SHA‑256):
  - Lokaldatei: `client_secure/index.html`
  - Gehostet (Node): `http://localhost:8080/app/secure`
  - Gehostet (Spring): `http://localhost:8081/app/secure/`

Hinweise zum Secure‑Client:
- AAD bindet `{ v, alg, from, to|room, ts }`.
- Passphrase ist während der Sitzung änderbar (Key‑Ring im RAM für Alt‑Nachrichten).

## Status prüfen
- Datei: `servers-status.http` (für VS Code REST Client / IntelliJ HTTP Client)
- Requests: `GET http://localhost:8080/` und `GET http://localhost:8081/`

