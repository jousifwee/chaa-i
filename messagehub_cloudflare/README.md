# Cloudflare MessageHub (Konzept)

Dieses Unterprojekt beschreibt einen MessageHub, der Cloudflare-Services nativ nutzt, um eine skalierbare, kosteneffiziente und global verfügbare Messaging-Schicht bereitzustellen. Der Fokus liegt zunächst auf einem Architektur- und Betriebsentwurf, der mit dem Cloudflare-Free-Plan kompatibel bleibt.

## Ziele
- **Edge-native Messaging**: Empfang und Verteilung von Nachrichten so nah wie möglich am Nutzer via Cloudflare Workers.
- **Sitzungs- und Zustandsmanagement**: Nutzung von Durable Objects für geordnete Zustellung, Locking und Präsenz-Tracking.
- **Reliable Delivery**: Einsatz von Cloudflare Queues als Puffer bei Backpressure sowie für Retries.
- **Persistenz-Backplane**: Optionaler Einsatz von R2 oder D1 für Auditing/Replay und Nutzer-Metadaten.
- **Sicherheit**: Cloudflare Access/Zero Trust für Admin-APIs und WebSocket-Upgrade-Protection.

## Zielarchitektur
1. **Ingress Worker**
   - Terminierung von HTTP/WebSocket-Verbindungen.
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

## Mögliche Transport- und Account-Limits (Cloudflare Free)
Die kostenlosen Limits ändern sich gelegentlich; folgende Annahmen müssen vor Produktionsbetrieb verifiziert werden:
- **Workers Requests pro Tag**: ca. 100 000 Requests/Tag im Free-Plan; Überschreitungen blockieren weitere Requests oder erfordern ein Upgrade.
- **CPU-Budget pro Request**: ~10 ms CPU-Zeit (inkl. Subrequests); komplexe Fan-out-Logik muss daher in DO/Queues verlagert werden.
- **Subrequest-Limit**: max. ~50 Subrequests pro Worker-Request; betrifft z. B. Aufrufe zu R2/D1 oder Webhooks.
- **Speicher/Laufzeit**: ~128 MB Arbeitsspeicher, max. 30 Sek. Gesamtlaufzeit; WebSockets laufen länger, aber zählen gegen gleichzeitige Verbindungen.
- **WebSockets**: Erlaubt, aber gleichzeitige Verbindungen erhöhen gleichzeitige Worker-Instanzen; Keep-Alives/Heartbeats sollten sparsam sein.
- **Durable Objects**: Gebührenfrei im Free-Plan, jedoch Quotas für gleichzeitige Verbindungen und Alarm-Timer; "Spawner"-Patterns vermeiden.
- **Queues**: Freikontingente sind begrenzt (z. B. O(1 M) Operationen/Monat, Größen-Limit pro Nachricht); Backpressure-Strategie nötig, um Quoten einzuhalten.
- **R2/D1**: Free-Tiers existieren (z. B. R2 10 GB Speicher, Request-Limits); schreibintensive Workloads können schnell Quoten erreichen.

## Betriebs- und Designüberlegungen
- **Backpressure**: Kombinierter Ansatz aus Queue-Längenmonitoring, DO-Level Flow-Control und moderaten Retry-Strategien (Exponentielles Backoff).
- **Idempotenz**: Nachrichten mit deterministischen IDs versehen; DO validiert und dedupliziert vor Weiterleitung an Downstream.
- **Observability**: Logging/Tracing via Workers Analytics Engine oder externem Collector; Metriken pro Kanal/DO-ID.
- **Mehrregion-Fähigkeit**: DOs sind regionsgebunden; deterministische ID-Zuweisung sorgt für konsistente Platzierung, globale Latenzen bleiben jedoch abhängig vom DO-Standort.
- **Konfigurierbare Transportwege**: Feature-Flags für WebSocket vs. HTTP-SSE, je nach Downstream-Fähigkeiten und Quoten.

## MVP-Scope
- Worker (Ingress) mit WebSocket-Upgrade, einfacher Authentifizierung und Weiterleitung zu einem einzelnen DO pro Kanal.
- Durable Object, das Nachrichten entgegennimmt, Reihenfolge gewährleistet und an verbundene Clients verteilt.
- Optionale Queue-Anbindung für Offline-Fan-out, zunächst nur als Stub.
- README-gestütztes Playbook für lokale Tests via `wrangler dev` und Deploy auf Free-Account.

## Offene Punkte
- Genaue Bestätigung der Cloudflare-Free-Limits für Queues, Durable Objects und WebSockets (Dokumentation/Support prüfen).
- Bewertung, ob KV-Namespaces für schnelle, eventual-consistent Presence-Daten sinnvoller sind als D1.
- Evaluierung eines Fallback-Transports (HTTP Long Polling) für Clients ohne WebSocket-Support.
- Security Review: CSP/Rate Limits, bot mitigation und DDoS-Regeln auf CF-Ebene.
