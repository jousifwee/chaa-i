# Cloudflare MessageHub

Diese Variante implementiert einen Cloudflare-Worker auf Basis von **Hono** und Durable Objects. Der Worker übernimmt HTTP- und WebSocket-Ingress, routet per Raum-ID an ein zuständiges Durable Object und begrenzt Payloads, um Cloudflare-Free-Tier-Limits zu schonen.

## Ziele
- **Edge-native Messaging**: Empfang und Verteilung von Nachrichten so nah wie möglich am Nutzer via Cloudflare Workers.
- **Sitzungs- und Zustandsmanagement**: Nutzung von Durable Objects für geordnete Zustellung, Locking und Präsenz-Tracking.
- **Reliable Delivery**: Stub für Queues-Anbindung vorbereitet (HTTP-Fan-out via Durable Object). Optional erweiterbar.
- **Persistenz-Backplane**: Optionaler Einsatz von R2 oder D1 für Auditing/Replay und Nutzer-Metadaten.
- **Sicherheit**: Cloudflare Access/Zero Trust für Admin-APIs und WebSocket-Upgrade-Protection.

## Schnelleinstieg

1. Wrangler konfigurieren (Account/Zone binden).
2. Deploy ausführen:
   ```bash
   cd messagehub_cloudflare
   wrangler deploy
   ```

Dev-Mode funktioniert analog mit `wrangler dev`.

## Routing & Limits

- **HTTP-API (Hono)**
  - `GET /` → Status JSON
  - `GET /health` → `200 ok`
  - `POST /rooms/:roomId/messages` → sendet Payload an das zuständige Durable Object; Payload-Limit **64 KiB** (ca. 65 536 Byte) zum Schutz vor Cloudflare-Limits.
- **WebSocket**
  - `GET /ws/:roomId` → Upgrade auf WebSocket; Nachrichten werden im Durable Object fan-out-broadcastet.
  - Pro eingehender WS-Message gilt ebenfalls das **64-KiB-Limit**; größere Frames werden mit Close-Code `1009` abgelehnt.

### Warum 64 KiB?
Cloudflare begrenzt HTTP- und WS-Payloads im Free-Plan (z. B. 128-KiB-WebSocket-Frame). 64 KiB hält ausreichend Abstand, um Aufschläge durch Event-Loop/Headers zu vermeiden und Fehlerraten zu reduzieren.

## Zielarchitektur
1. **Ingress Worker**
   - Terminierung von HTTP/WebSocket-Verbindungen via Hono.
   - Authentifizierung (z. B. JWT/Bearer oder Access-Token) und Ratenbegrenzung.
   - Routing pro Kanal/Sitzung zu einem zuständigen Durable Object (DO) mittels deterministischer DO-ID.

2. **Session Durable Objects**
   - Serialisieren Nachrichten pro Kanal, um Reihenfolge zu garantieren.
   - Verwalten verbundener WebSocket-Clients, Heartbeats und Presence-Status.
   - Weiterleitung an **Cloudflare Queues** für asynchrone Verarbeitung (Fan-out, Webhooks, Backends).

3. **Queues Worker**
   - Konsumiert Nachrichten aus der Queue, führt Retries und Dead-Letter-Handling durch.
   - Optional: Persistiert Events in **R2** (Objektspeicher) oder **D1** (SQL) für Replays/Auditing.

4. **Outbound Connectors**
   - HTTP Webhooks, E-Mail/SMS Provider oder weitere interne Services als Downstream.
   - Nutzung von **Workers Cron** für periodische Aufgaben (z. B. Cleanup/TTL von Sessions).

## Betriebs- und Designüberlegungen
- **Backpressure**: Kombinierter Ansatz aus Queue-Längenmonitoring, DO-Level Flow-Control und moderaten Retry-Strategien (Exponentielles Backoff).
- **Idempotenz**: Nachrichten mit deterministischen IDs versehen; DO validiert und dedupliziert vor Weiterleitung an Downstream.
- **Observability**: Logging/Tracing via Workers Analytics Engine oder externem Collector; Metriken pro Kanal/DO-ID.
- **Mehrregion-Fähigkeit**: DOs sind regionsgebunden; deterministische ID-Zuweisung sorgt für konsistente Platzierung, globale Latenzen bleiben jedoch abhängig vom DO-Standort.
- **Konfigurierbare Transportwege**: Feature-Flags für WebSocket vs. HTTP-SSE, je nach Downstream-Fähigkeiten und Quoten.

## MVP-Scope
- Worker (Ingress) mit WebSocket-Upgrade, einfacher Authentifizierung (noch Stub) und Weiterleitung zu einem einzelnen DO pro Kanal.
- Durable Object, das Nachrichten entgegennimmt, Reihenfolge gewährleistet und an verbundene Clients verteilt; begrenzt Payloads auf 64 KiB.
- Optionale Queue-Anbindung für Offline-Fan-out, zunächst nur als Stub.
- README-gestütztes Playbook für lokale Tests via `wrangler dev` und Deploy auf Free-Account.

## Offene Punkte
- Genaue Bestätigung der Cloudflare-Free-Limits für Queues, Durable Objects und WebSockets (Dokumentation/Support prüfen).
- Bewertung, ob KV-Namespaces für schnelle, eventual-consistent Presence-Daten sinnvoller sind als D1.
- Evaluierung eines Fallback-Transports (HTTP Long Polling) für Clients ohne WebSocket-Support.
- Security Review: CSP/Rate Limits, bot mitigation und DDoS-Regeln auf CF-Ebene.
