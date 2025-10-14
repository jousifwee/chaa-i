# Server- und Technologiealternativen

Ziele: WebSocket-Routing (P2P und Rooms), geringe Latenz, E2EE auf Anwendungsebene, einfache Betriebsfähigkeit, später skalierbar.

## Node.js (empfohlen für MVP)
- Stack: Node.js + `ws` (reines WS) oder Fastify/Express + `ws`.
- Vorteile: Schnell startklar, breite Community, gutes WS-Ökosystem, gleiche Sprache wie Client (TS/JS).
- Nachteile: Single-threaded Event-Loop (Skalierung via Cluster/Horizontal + Redis/Broker).
- Skalierung: Redis Pub/Sub, Sticky Sessions hinter Load Balancer, ggf. NATS/Kafka für Events.

## Deno / Bun
- Vorteile: Moderne Runtimes, TypeScript first (Deno), schnelles Dev-Erlebnis (Bun).
- Nachteile: Kleinere Ökosysteme, Betriebsreife/Tooling variiert.

## Go
- Stack: `net/http` + Gorilla/WebSocket oder `nhooyr.io/websocket`.
- Vorteile: Geringe Latenz, einfache Deploys, gute Concurrency.
- Nachteile: Mehr Boilerplate, andere Sprache als Client.
- Skalierung: Leichtgewichtig, gut containerisierbar, Redis/NATS-Anbindung.

## Rust
- Stack: Axum/Actix + `tokio-tungstenite`.
- Vorteile: Performance, Sicherheit (Memory Safety).
- Nachteile: Höhere Komplexität/Entwicklungszeit.

## Elixir (Phoenix Channels)
- Vorteile: Exzellent für WebSockets/Realtime, Clustering out-of-the-box.
- Nachteile: Neues Paradigma/Stack, Team-Fit beachten.

## Serverless WebSockets
- Anbieter: AWS API Gateway (WebSocket), Cloudflare Durable Objects, Fly, Supabase Realtime.
- Vorteile: Weniger Ops, schnelle Skalierung.
- Nachteile: Anbieterbindung, Latenz/Kosten, Featuregrenzen (z. B. Auth/Custom-Routing), State-Management.

## Messaging/Broker-gestützt
- NATS, Kafka, Redis Streams als Backbone; edge-node als WS-Gateway.
- Vorteile: Hohe Ausfallsicherheit, klare Entkopplung.
- Nachteile: Mehr Systeme/Komplexität.

## Empfehlung
- MVP: Node.js + `ws` (einfach, schnell), optional Redis bei Skalierung.
- Perspektive: Für hohe Last/Verfügbarkeit Go/Elixir in Betracht ziehen, ggf. mit Broker.

