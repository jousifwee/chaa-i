const te = new TextEncoder();
const td = new TextDecoder();

const b64enc = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const b64dec = (b64: string) => new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

export async function deriveKeyFromPassphrase(passphrase: string): Promise<CryptoKey> {
  const hash = await sha256(te.encode(passphrase));
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export function headerFor(from: string, toVal?: string, roomVal?: string) {
  return { v: 1, alg: 'aes-256-gcm-sha256', from, to: toVal || undefined, room: roomVal || undefined, ts: Date.now() };
}

export function aadBytesFor(header: any): Uint8Array {
  return te.encode(JSON.stringify(header));
}

export async function encryptUtf8(plaintext: string, key: CryptoKey, aadBytes: Uint8Array) {
  const nonce = new Uint8Array(12);
  crypto.getRandomValues(nonce);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, additionalData: aadBytes }, key, te.encode(plaintext))
  );
  return { nonceB64: b64enc(nonce), ciphertextB64: b64enc(ct) };
}

export async function decryptUtf8(ciphertextB64: string, nonceB64: string, key: CryptoKey, aadBytes: Uint8Array) {
  const ct = b64dec(ciphertextB64);
  const nonce = b64dec(nonceB64);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce, additionalData: aadBytes }, key, ct);
  return td.decode(new Uint8Array(pt));
}

export function b64Encode(bytes: Uint8Array) { return b64enc(bytes); }
export function b64Decode(s: string) { return b64dec(s); }

