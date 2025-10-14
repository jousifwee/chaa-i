# Architektur & Technologieauswahl

Dieses Dokument beschreibt den ersten Wurf der Architektur für „chaa-i“, einen verschlüsselnden Kommunikator als Web‑App, sowie die Technologieauswahl und Erweiterungspfade.

## Ziele (MVP)
- Eingabe eines Schlüssels als Text (Passphrase)
- Ableitung eines AES‑256‑Schlüssels via SHA‑256 aus dem Text
- Ver-/Entschlüsselung von UTF‑8‑Texten mit AES‑256‑GCM (WebCrypto im Browser)
- Ein Routing‑Server vermittelt Nachrichten von Quelle zu Ziel
- Jeder Client hält eine HTTP‑basierte Session (WebSocket) zum Server

## Technologieauswahl (MVP)
- Client: Browser‑WebApp (SPA) mit TypeScript, React oder Svelte (leichtgewichtig), WebCrypto (`window.crypto.subtle`), WebSocket für Echtzeit.
- Server: Node.js (TypeScript) + Fastify/Express, `ws` für WebSockets. Optional Redis Pub/Sub für Skalierung.
- Datenhaltung: Für MVP in‑Memory; optional Redis bei horizontaler Skalierung.
- Protokoll: JSON‑Nachrichten, versioniert, Ende‑zu‑Ende verschlüsselt auf Anwendungsebene.

## Antworten auf die Kernfragen
- Serverlose Kommunikation zwischen Clients?
  - Rein serverlos ist im Web realistisch nicht möglich, da mindestens Signaling/NAT‑Traversal benötigt wird. Für echtes P2P wird i.d.R. WebRTC + STUN/TURN und ein Signaling‑Kanal gebraucht. Für das MVP setzen wir zentralen Routing‑Server ein. Perspektivisch: P2P via WebRTC, siehe `docs/P2P_WEBRTC.md`.
- Point‑to‑Point Kommunikation – wie?
  - MVP: Client A verschlüsselt mit gemeinsamem Schlüssel, sendet über WebSocket an Server, dieser routet exklusiv an Client B. Nur Ciphertext, Nonce und Metadaten werden übertragen; der Server bleibt blind. Später: P2P über WebRTC‑DataChannels (Signaling weiterhin nötig).
- Chatgruppenkommunikation – wie?
  - MVP: Ein „Room“ mit gemeinsam geteilter Passphrase (ein Gruppen‑Key). Sender verschlüsselt mit Gruppen‑Key, Server broadcastet an Room‑Mitglieder. Später: Besserer Gruppen‑Schlüsselwechsel (Sender Keys/MLS), siehe `docs/GRUPPENCHAT.md`.
- Gruppenchat als Routing über einander vertrauende User (Weiterentwicklung)
  - Perspektive: Dezentralisiertes Routing über vertrauenswürdige Peers (Onion‑Routing‑ähnlich, Hop‑by‑Hop weitergeleitet), weiterhin E2EE auf Anwendungsebene. Siehe `docs/GRUPPENCHAT.md`.

## Komponentenüberblick
- Client WebApp: UI, Key‑Handling, lokale Kryptographie, WebSocket‑Client, Nachrichten‑Queue.
- Kryptoschicht: KDF (MVP: SHA‑256); AES‑256‑GCM mit 96‑bit Nonce; eindeutige `alg`/`v`‑Kennung; UTF‑8 Encoding.
- Protokoll: Versionierte JSON‑Hüllen mit `type`, `payload`, `nonce`, `aad`, `ts`, `from`, `to|room`.
- Routing‑Server: Authentifizierungs‑Stub, Session‑Management, Room‑Registrierung, Punkt‑zu‑Punkt‑Routing, Broadcast.
- Erweiterungen: WebRTC für P2P, Gruppen‑KMI (Key‑Management‑Improvement), MLS/Double‑Ratchet, Föderation/Dezentralisierung.

## Sicherheitsnotizen
- MVP nutzt SHA‑256(Passphrase) → AES‑Key (gewünscht). Für Produktion empfiehlt sich ein gestreckter KDF (Argon2id/scrypt/PBKDF2) + Salt, um schwache Passphrasen zu härten. Siehe `docs/KRYPTO.md`.
- Pro Nachricht frischer Nonce; Nonce‑Wiederverwendung vermeiden.
- Optionale AAD (z. B. `from`, `to`, `ts`, `alg`, `v`) binden, um Metadatenintegrität zu stärken.

## Skalierung
- Mehrere Server‑Instanzen: Redis Pub/Sub für Room‑Broadcast und Präsenz.
- Load‑Balancing: Sticky Sessions für WebSockets, oder zentraler Broker.

## Roadmap (kurz)
1) MVP (zentraler Router, E2EE, Gruppenpassphrase)
2) Verbesserter KDF + Key‑Rotation
3) P2P via WebRTC DataChannels
4) Gruppen‑KMI (Sender Keys/MLS)
5) Föderation/vertrauensbasierte Weiterleitung

