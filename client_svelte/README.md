# chaa-i Svelte Client

Svelte + Vite WebApp, unterstuetzt Klartext und AES-256-GCM (Passphrase -> SHA-256) gemaess `docs/PROTOKOLL.md`.

## Entwicklung
```
cd client_svelte
npm install
npm run dev
# oeffne http://localhost:5173
```

## Build
```
npm run build
# Ausgabe: client_svelte/dist/
```

## Hosting in Servern

Node-Server:
- Route: `http://localhost:8080/app/svelte`
- Dient `client_svelte/dist/` oder `server/public/app/svelte/` aus
- Sync-Skript: `scripts/sync-to-node.ps1` oder `sync-to-node.sh`

Spring Boot:
- Route: `http://localhost:8081/app/svelte/`
- Zielpfad: `server_spring/src/main/resources/static/app/svelte/`
- Sync-Skript: `scripts/sync-to-spring.ps1` oder `sync-to-spring.sh`

## Hinweise
- UI trennt Konfiguration, Verbindung und Nachrichten in uebersichtliche Bereiche.
- Username, Serveradresse, Rooms, Verschluesselungsstatus und Passphrase werden lokal im Browser-Speicher abgelegt.
