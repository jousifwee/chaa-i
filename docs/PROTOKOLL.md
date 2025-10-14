# Nachrichtenprotokoll (MVP)

JSON-Hülle, Ende-zu-Ende verschlüsselt auf Anwendungsebene. Der Server sieht nur Metadaten.

## Gemeinsame Felder
- `v`: Protokollversion (z. B. `1`)
- `alg`: Algorithmuskennung, z. B. "aes-256-gcm-sha256"
- `ts`: Unix ms Timestamp (Clientzeit; optional Server ergänzt Empfangszeit)
- `from`: Sender-ID (vom Client gewählt oder serverseitig vergeben)
- `to`: Ziel-ID (für P2P) – exklusiv zu `room`
- `room`: Raum-/Gruppen-ID (für Broadcast) – exklusiv zu `to`
- `nonce`: Base64 Nonce (12 Byte)
- `aad`: optional, Base64 der gebundenen Header
- `ciphertext`: Base64 der GCM-Ausgabe (inkl. Auth-Tag)

## Typen
- `type: "msg"` – Chatnachricht (Ciphertext enthält UTF‑8‑Text)
- `type: "join"` – Raumbeitritt (nicht zwingend verschlüsselt; optional minimal signiert/geschützt)
- `type: "leave"` – Verlassen eines Raums
- `type: "presence"` – Präsenz-/Systemevent (Server → Client)

## Beispiel (verschlüsselte Nachricht)
```json
{
  "type": "msg",
  "v": 1,
  "alg": "aes-256-gcm-sha256",
  "ts": 1734200000000,
  "from": "alice",
  "to": "bob",
  "nonce": "m2gOQz3v9p3Wm3aWzQ8nCA==",
  "aad": "eyJ2IjoxLCJhbGciOiJhZXMtMjU2LWdjbS1zaGEyNTYiLCJmcm9tIjoiYWxpY2UiLCJ0byI6ImJvYiIsInRzIjoxNzM0MjAwMDAwMH0=",
  "ciphertext": "7T0zUj2...=="
}
```

## AAD-Bindung
- Empfohlen: `{ v, alg, from, to|room, ts }` deterministisch serialisieren und als AAD verwenden.

## Fehlerbehandlung
- Bei GCM-Auth-Fehler: Nachricht verwerfen, optional UI-Hinweis.
- Bei unbekannter `v`/`alg`: Nachricht puffern/ablehnen je nach Policy.

