const encoder = new TextEncoder();
const decoder = new TextDecoder();

const b64encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const b64decode = (value: string) => new Uint8Array(atob(value).split('').map((c) => c.charCodeAt(0)));

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

export async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const hash = await sha256(encoder.encode(passphrase));
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export function buildHeader(from: string, to?: string, room?: string) {
  return {
    v: 1,
    alg: 'aes-256-gcm-sha256',
    from,
    to: to || undefined,
    room: room || undefined,
    ts: Date.now()
  };
}

export function aadBytes(header: Record<string, unknown>): Uint8Array {
  return encoder.encode(JSON.stringify(header));
}

export async function encryptUtf8(plaintext: string, key: CryptoKey, aad: Uint8Array) {
  const nonce = new Uint8Array(12);
  crypto.getRandomValues(nonce);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, additionalData: aad }, key, encoder.encode(plaintext))
  );
  return { nonceB64: b64encode(nonce), ciphertextB64: b64encode(ciphertext) };
}

export async function decryptUtf8(ciphertextB64: string, nonceB64: string, key: CryptoKey, aad: Uint8Array) {
  const ciphertext = b64decode(ciphertextB64);
  const nonce = b64decode(nonceB64);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce, additionalData: aad }, key, ciphertext);
  return decoder.decode(new Uint8Array(plaintext));
}

export { b64encode, b64decode };

