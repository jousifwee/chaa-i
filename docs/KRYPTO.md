# Kryptographie (MVP und Erweiterung)

## MVP-Parameter
- KDF: PBKDF2 (oder initial SHA-256, siehe unten) → 32 Byte AES-Key
- Verschlüsselung: AES-256-GCM, Nonce 96 Bit (12 Byte), pro Nachricht frisch
- Encoding: UTF-8 für Klartext; Base64 für `nonce` und `ciphertext`
- AAD: Binde ausgewählte Headerfelder (z. B. `v`, `alg`, `from`, `to|room`, `ts`) als Additional Authenticated Data

Hinweis: Diese KDF ist für den ersten Wurf gewünscht. Für Produktion bitte einen gestreckten KDF (Argon2id/scrypt/PBKDF2 mit Salt+Workfactor) einsetzen.

## WebCrypto-Referenz (TypeScript)
```ts
// Hilfen
const enc = new TextEncoder();
const dec = new TextDecoder();

export async function sha256(bytes: Uint8Array): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', bytes);
}

export function b64encode(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin);
}

export function b64decode(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// KDF (Empfohlen MVP): PBKDF2 -> AES-256 (mit Salt & Iterationen)
export async function deriveAesKeyPBKDF2(passphrase: string, salt: Uint8Array, iterations = 150_000): Promise<CryptoKey> {
  const passBytes = enc.encode(passphrase);
  const baseKey = await crypto.subtle.importKey('raw', passBytes, 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// KDF (Alternative/ursprüngliche Vorgabe): SHA-256(passphrase) -> AES-256
export async function deriveAesKeySHA256(passphrase: string): Promise<CryptoKey> {
  const passBytes = enc.encode(passphrase);
  const hash = await sha256(passBytes); // 32 bytes
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

// AES-GCM Verschlüsselung (UTF-8)
export async function encryptUtf8(
  plaintext: string,
  key: CryptoKey,
  aad?: Uint8Array
): Promise<{ nonceB64: string; ciphertextB64: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const alg = { name: 'AES-GCM', iv, additionalData: aad } as AesGcmParams;
  const pt = enc.encode(plaintext);
  const ct = await crypto.subtle.encrypt(alg, key, pt);
  return { nonceB64: b64encode(iv.buffer), ciphertextB64: b64encode(ct) };
}

// AES-GCM Entschlüsselung (UTF-8)
export async function decryptUtf8(
  ciphertextB64: string,
  nonceB64: string,
  key: CryptoKey,
  aad?: Uint8Array
): Promise<string> {
  const iv = b64decode(nonceB64);
  const ct = b64decode(ciphertextB64);
  const alg = { name: 'AES-GCM', iv, additionalData: aad } as AesGcmParams;
  const pt = await crypto.subtle.decrypt(alg, key, ct);
  return dec.decode(pt);
}
```

## AAD-Empfehlung
- Serialisiere die zu bindenden Header deterministisch (z. B. `JSON.stringify({v, alg, from, to, room, ts})`) und nutze deren UTF-8-Bytes als AAD.

## Sicherheitsaspekte
- Nonce niemals wiederverwenden; pro Nachricht neu generieren.
- Keine Schlüssel im LocalStorage; nur im Speicher halten.
- Bei schwachen Passphrasen droht Wörterbuchangriff. Für Produktion KDF härten und Salt verwenden.
- Optional Replay-Schutz (z. B. `ts` + Empfänger-Cache) implementieren.

## Erweiterungspfade
- KDF: Argon2id/scrypt/PBKDF2+Salt mit konfigurierbaren Parametern.
- Algorithmenfamilien kapseln: `alg` Kennung wie `aes-256-gcm-sha256` (MVP), später Varianten hinzufügen.
- Asymmetrische Verfahren für Schlüsselaustausch (ECDH, X25519) und Ratchets (Double Ratchet/MLS) vorbereiten.
