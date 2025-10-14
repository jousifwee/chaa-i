# chaa-i Routing Server (Spring Boot)

Alternatives Servergeruest mit Spring Boot (WebSocket), kompatibel zu `docs/PROTOKOLL.md`.

- HTTP Health: `GET /` -> Text
- WebSocket Endpoint: `ws://localhost:8081/ws`

## Starten

Voraussetzung: JDK 21+ und Maven.

- Entwicklung:
  - `cd server_spring`
  - `mvn spring-boot:run`

- Produktion (Jar bauen):
  - `mvn clean package`
  - `java -jar target/chaa-i-server-spring-0.1.0.jar`

## Gehostete Web-App
- Index: `http://localhost:8081/app/`
- Verschluesselter Client: `http://localhost:8081/app/secure/`
- Einfacher Client: `http://localhost:8081/app/simple/`
- Svelte Client: `http://localhost:8081/app/svelte/`
- Angular Client: `http://localhost:8081/app/angular/`

Statische Dateien liegen in `server_spring/src/main/resources/static/app/`.

## Routing-Logik
- `type: "join"` mit `{ userId: string, rooms?: string[] }`
- `type: "msg"` mit `{ to?: string, room?: string, ... }`
- `type: "leave"` entfernt Nutzer aus angegebenen Rooms

Hinweise:
- In-Memory Maps (`clients`, `rooms`); fuer Skalierung Redis Pub/Sub o. ae. ergaenzen.
- `setAllowedOrigins("*")` nur fuer MVP offen lassen; Produktion absichern.

## Docker

### Dockerfile (Multi-Stage)
- Datei: `server_spring/Dockerfile`
- Basis: `maven:3.9.6-eclipse-temurin-21` (Build) -> `eclipse-temurin:21-jre` (Run)

### Image bauen
```
cd server_spring
docker build -t chaai/chaa-i-server-spring:0.1.0 .
```

### Container starten
```
docker run --rm -p 8081:8081 chaai/chaa-i-server-spring:0.1.0
# Port aendern (Beispiel 9090):
docker run --rm -e JAVA_OPTS="-Dserver.port=9090" -p 9090:9090 chaai/chaa-i-server-spring:0.1.0
```

### Alternative: Buildpacks (ohne Dockerfile)
```
mvn -DskipTests spring-boot:build-image -Dspring-boot.build-image.imageName=chaai/chaa-i-server-spring:0.1.0
```
Danach wie oben mit `docker run` starten.

## Client Deployments
- Svelte
  - Build: `cd client_svelte && npm install && npm run build`
  - Sync: `client_svelte/scripts/sync-to-spring.(ps1|sh)`
  - Ziel: `server_spring/src/main/resources/static/app/svelte/`
  - Aufruf: `http://localhost:8081/app/svelte/`
- Angular
  - Build: `cd client_angular && npm install && npm run build`
  - Sync: `client_angular/scripts/sync-to-spring.(ps1|sh)`
  - Ziel: `server_spring/src/main/resources/static/app/angular/`
  - Aufruf: `http://localhost:8081/app/angular/`

