# Cloudflare MessageHub

Diese Variante implementiert einen Cloudflare-Worker auf Basis von **Hono** und Durable Objects. Der Worker übernimmt HTTP- und
WebSocket-Ingress, routet per Raum-ID an ein zuständiges Durable Object und begrenzt Payloads, um Cloudflare-Free-Tier-Limits zu
 schonen.

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
   cd server_cloudflare
   wrangler deploy
   ```

Dev-Mode funktioniert analog mit `wrangler dev`.

## Step-by-step Deploy zu Cloudflare

1. **Repository vorbereiten**
   - Sicherstellen, dass Node.js (≥18) und Wrangler (≥3) installiert sind: `npm install -g wrangler`.
   - In das Projektverzeichnis wechseln: `cd server_cloudflare`.
2. **Cloudflare-Account verknüpfen**
   - `wrangler login` ausführen und den Browser-Flow bestätigen.
   - `wrangler whoami` prüfen; die `account_id` wird für das Deployment benötigt.
3. **Konfiguration anpassen**
   - In `wrangler.toml` die Platzhalter für `account_id` (und optional `name`/`main`) setzen.
   - Falls benötigte Bindings (Durable Objects, Queues, R2/D1) noch fehlen, sie im Cloudflare-Dashboard anlegen und hier eintragen.
4. **Lokal testen**
   - `wrangler dev --persist` starten, um Durable Objects lokal zu emulieren.
   - HTTP/WS-Endpunkte testen, z. B. `curl http://localhost:8787/health` oder WebSocket-Client gegen `ws://localhost:8787/ws/<roomId>`.
5. **Deployment auslösen**
   - `wrangler deploy` ausführen. Wrangler erstellt die Durable Objects und veröffentlicht den Worker.
   - Auf der ausgegebenen Worker-URL die Health-Route (`/health`) aufrufen, um den Status zu prüfen.
6. **Monitoring & Limits**
   - In den Cloudflare-Metriken (Workers/Durable Objects) Nachrichtenraten und Fehlerraten beobachten.
   - Bei 413/1009-Fehlern Payload-Größen prüfen und ggf. Downstream-Limits anpassen.

## Routing & Limits

- **HTTP-API (Hono)**
  - `GET /` → Status JSON
  - `GET /health` → `200 ok`
  - `POST /rooms/:roomId/messages` → sendet Payload an das zuständige Durable Object; Payload-Limit **64 KiB** (ca. 65 536 Byte)
 zum Schutz vor Cloudflare-Limits. Requests mit `Content-Length` über dem Limit werden früh mit `413` abgewiesen, damit keine üb
ergroßen Bodies in den Worker geladen werden.
- **WebSocket**
  - `GET /ws/:roomId` → Upgrade auf WebSocket; Nachrichten werden im Durable Object fan-out-broadcastet.
  - Pro eingehender WS-Message gilt ebenfalls das **64-KiB-Limit**; größere Frames werden mit Close-Code `1009` abgelehnt.

### Warum 64 KiB?
Cloudflare begrenzt HTTP- und WS-Payloads im Free-Plan (z. B. 128-KiB-WebSocket-Frame). 64 KiB hält ausreichend Abstand, um Aufs
chläge durch Event-Loop/Headers zu vermeiden und Fehlerraten zu reduzieren.

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
- **Backpressure**: Kombinierter Ansatz aus Queue-Längenmonitoring, DO-Level Flow-Control und moderaten Retry-Strategien (Expone
ntielles Backoff).
- **Idempotenz**: Nachrichten mit deterministischen IDs versehen; DO validiert und dedupliziert vor Weiterleitung an Downstream.
- **Observability**: Logging/Tracing via Workers Analytics Engine oder externem Collector; Metriken pro Kanal/DO-ID.
- **Mehrregion-Fähigkeit**: DOs sind regionsgebunden; deterministische ID-Zuweisung sorgt für konsistente Platzierung, globale L
atenzen bleiben jedoch abhängig vom DO-Standort.
- **Konfigurierbare Transportwege**: Feature-Flags für WebSocket vs. HTTP-SSE, je nach Downstream-Fähigkeiten und Quoten.

## MVP-Scope
- Worker (Ingress) mit WebSocket-Upgrade, einfacher Authentifizierung (noch Stub) und Weiterleitung zu einem einzelnen DO pro Ka
nal.
- Durable Object, das Nachrichten entgegennimmt, Reihenfolge gewährleistet und an verbundene Clients verteilt; begrenzt Payloads
 auf 64 KiB.
- Optionale Queue-Anbindung für Offline-Fan-out, zunächst nur als Stub.
- README-gestütztes Playbook für lokale Tests via `wrangler dev` und Deploy auf Free-Account.

## Offene Punkte
- Genaue Bestätigung der Cloudflare-Free-Limits für Queues, Durable Objects und WebSockets (Dokumentation/Support prüfen).
- Bewertung, ob KV-Namespaces für schnelle, eventual-consistent Presence-Daten sinnvoller sind als D1.
- Evaluierung eines Fallback-Transports (HTTP Long Polling) für Clients ohne WebSocket-Support.
- Security Review: CSP/Rate Limits, bot mitigation und DDoS-Regeln auf CF-Ebene.
