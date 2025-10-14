# chaa-i Routing Server (Spring Boot)

Ein alternatives Servergerüst mit Spring Boot (WebSocket), kompatibel zum Protokoll in `docs/PROTOKOLL.md`.

- HTTP Health: `GET /` → Text
- WebSocket Endpoint: `ws://localhost:8081/ws`

## Starten

Voraussetzung: JDK 17+ und Maven.

- Entwicklung:
  - `cd server_spring`
  - `mvn spring-boot:run`

- Produktion (Jar bauen):
  - `mvn clean package`
  - `java -jar target/chaa-i-server-spring-0.1.0.jar`

## Routing-Logik
- `type: "join"` mit `{ userId: string, rooms?: string[] }` registriert Nutzer und Rooms
- `type: "msg"` mit `{ to?: string, room?: string, ... }` leitet Ciphertext P2P oder an alle Room-Mitglieder weiter (Server bleibt blind)
- `type: "leave"` entfernt Nutzer aus angegebenen Rooms

Hinweise:
- In-Memory Maps (`clients`, `rooms`), für Skalierung Redis Pub/Sub o.ä. ergänzen.
- `setAllowedOrigins("*")` ist für MVP offen; in Produktion Herkunft einschränken.

