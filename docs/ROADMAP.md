# Roadmap

## Phase 1: MVP
- WebApp mit E2EE (SHA‑256 → AES‑256‑GCM), WebSocket‑Router, Rooms
- Basis‑Protokoll v1, JSON, AAD‑Bindung

## Phase 2: Sicherheit hart machen
- KDF‑Umstieg (Argon2id/scrypt/PBKDF2+Salt), Key‑Rotation
- Nonce‑Disziplin Tests, Replay‑Schutz, CSP/TTP

## Phase 3: P2P
- WebRTC Signaling über Server, STUN/TURN Integration
- DataChannel‑Transport mit gleicher Anwendungs‑Kryptoschicht

## Phase 4: Gruppen‑KMI
- Sender Keys oder MLS, effizientes Re‑Keying bei Membership‑Changes

## Phase 5: Dezentralisierung
- Föderation/Peering, Routing über vertrauenswürdige Nutzer, optionale Onion‑Hops

