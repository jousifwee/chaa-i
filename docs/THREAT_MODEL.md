# Threat Model (Kurzfassung)

## Angreifer
- Netzwerk‑Angreifer: Abhören/Manipulation des Transports
- Serverbetreiber/‑Angreifer: Einsicht in Metadaten; versucht Inhalte zu lesen
- Clientseitig: XSS/CSRF/Extensions/Shoulder Surfing

## Annahmen
- Anwendungsebene E2EE korrekt implementiert (AES‑GCM, Nonce‑Disziplin)
- Passphrase wird lokal eingegeben und nicht persistiert

## Risiken & Mitigation
- Schwache Passphrasen → Wörterbuchangriffe: KDF härten (Argon2id/scrypt), Passphrase‑Policy, optional Passkey‑basierte Ableitung.
- Nonce‑Wiederverwendung → GCM‑Kompromittierung: sichere Randoms, Tests, Monitoring.
- Metadaten‑Lecks (Wer mit wem, wann): Minimierung der Felder, optionale Padding/Batching/Delays.
- Replay: `ts` + Empfängerseitiger Fenster‑Cache.
- XSS: Strikte CSP, DOMPurify bei Markdown, keine `innerHTML`.
- Key‑Exposure: Schlüssel nur im RAM; Tab‑Sperre/Lock‑Screen; kein LocalStorage.

