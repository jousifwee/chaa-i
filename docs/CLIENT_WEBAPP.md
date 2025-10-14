# Client WebApp (MVP)

## Aufbau
- SPA (React/Svelte) mit TypeScript
- State: `session`, `rooms`, `peers`, `keyMaterial` (nur im RAM), `messages`
- Netz: WebSocket (`wss://server/ws`) – 1 Session pro Client

## Flüsse
- Login/Beitritt: Nutzer vergibt `displayName`, optional `userId`; wählt `room` oder `to`.
- Schlüssel: Nutzer gibt Passphrase ein → lokaler KDF → `CryptoKey` im RAM.
- Senden: Klartext UTF‑8 → AAD bauen → AES‑GCM → JSON senden.
- Empfangen: JSON → AAD bauen → GCM prüfen → UTF‑8 anzeigen.

## UI-Skizze
- Eingabefelder: `Passphrase`, `Ziel (User/Room)`
- Nachrichtenliste (zeitlich sortiert), Eingabezeile, Senden-Button
- Indikatoren: Verbunden/Neuverbinden, GCM‑Fehler, Raumteilnehmer

## Beispielcode (Ausschnitt)
```ts
import {
  deriveAesKeyFromPassphrase,
  encryptUtf8,
  decryptUtf8
} from './crypto';

let key: CryptoKey | null = null;

async function onPassphrase(p: string) {
  key = await deriveAesKeyFromPassphrase(p);
}

function aadFor(header: any): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(header));
}

async function sendMessage(ws: WebSocket, to: string | null, room: string | null, text: string, from: string) {
  if (!key) throw new Error('Kein Schlüssel');
  const header = { v: 1, alg: 'aes-256-gcm-sha256', from, to, room, ts: Date.now() };
  const aad = aadFor(header);
  const { nonceB64, ciphertextB64 } = await encryptUtf8(text, key, aad);
  const aadB64 = btoa(String.fromCharCode(...aad));
  const msg = { type: 'msg', ...header, aad: aadB64, nonce: nonceB64, ciphertext: ciphertextB64 };
  ws.send(JSON.stringify(msg));
}

async function onMessage(ev: MessageEvent) {
  const data = JSON.parse(ev.data);
  if (data.type !== 'msg' || !key) return;
  const { v, alg, from, to, room, ts, nonce, aad, ciphertext } = data;
  const header = { v, alg, from, to, room, ts };
  const aadBytes = new Uint8Array(atob(aad).split('').map(c => c.charCodeAt(0)));
  const text = await decryptUtf8(ciphertext, nonce, key, aadBytes);
  // anzeigen
}
```

## Sicherheit
- Keine Persistenz des Schlüssels; bei Reload neu eingeben.
- CSP/Trusted Types gegen XSS.
- Clipboard vorsichtig behandeln; keine automatischen Logs.

