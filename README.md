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

Minimales Servergerüst: siehe `server/` (TypeScript, ws), Start: `npm i && npm run dev`.
