<script lang="ts">
  import { onMount } from 'svelte';
  import { deriveKeyFromPassphrase, headerFor, aadBytesFor, encryptUtf8, decryptUtf8 } from '$lib/crypto';

  const CONFIG_KEY = 'chaa_i_svelte_client';
  const MAX_LOG = 400;

  let url = 'ws://localhost:8080/ws';
  let userId = '';
  let rooms = '';
  let to = '';
  let room = '';
  let text = '';
  let pass = '';
  let useEncryption = true;

  let status = 'Nicht verbunden';
  let connected = false;
  let statusClass = 'status';
  let log: string[] = [];
  let ws: WebSocket | null = null;
  let keyRing: CryptoKey[] = [];
  let configReady = false;

  function write(kind: string, payload: unknown) {
    const time = new Date().toLocaleTimeString();
    const message = `[${time}] ${kind}: ${typeof payload === 'string' ? payload : JSON.stringify(payload)}`;
    log = [...log.slice(-(MAX_LOG - 1)), message];
    queueMicrotask(() => {
      const el = document.getElementById('log');
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  function setConn(next: boolean) {
    connected = next;
    status = next ? 'Verbunden' : 'Nicht verbunden';
    statusClass = next ? 'status ok' : 'status';
  }

  function setKey(k: CryptoKey) {
    keyRing.unshift(k);
    if (keyRing.length > 5) keyRing.pop();
  }

  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
      if (typeof saved.url === 'string' && saved.url) url = saved.url;
      if (typeof saved.userId === 'string' && saved.userId) userId = saved.userId;
      if (typeof saved.rooms === 'string') rooms = saved.rooms;
      if (typeof saved.pass === 'string') pass = saved.pass;
      if (typeof saved.useEncryption === 'boolean') useEncryption = saved.useEncryption;
    } catch {}
    if (!userId) userId = 'user-' + Math.random().toString(36).slice(2, 8);
    configReady = true;
  });

  $: if (configReady) {
    try {
      localStorage.setItem(
        CONFIG_KEY,
        JSON.stringify({ url, userId, rooms, pass, useEncryption })
      );
    } catch {}
  }

  $: if (!useEncryption) {
    keyRing = [];
  }

  async function connect() {
    if (!url || !userId) {
      alert('URL und User-ID sind erforderlich');
      return;
    }

    keyRing = [];
    if (useEncryption) {
      if (!pass) {
        alert('Passphrase ist erforderlich');
        return;
      }
      try {
        setKey(await deriveKeyFromPassphrase(pass));
      } catch {
        alert('Schluesselableitung fehlgeschlagen');
        return;
      }
    }

    try { ws?.close(); } catch {}
    ws = new WebSocket(url);

    ws.addEventListener('open', () => {
      setConn(true);
      write('OPEN', url);
      const list = rooms ? rooms.split(',').map((s) => s.trim()).filter(Boolean) : [];
      const join = { type: 'join', userId, rooms: list.length ? list : undefined };
      ws!.send(JSON.stringify(join));
      write('SEND', join);
    });

    ws.addEventListener('message', async (event) => {
      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch {
        write('RECV', event.data);
        return;
      }

      if (data.type !== 'msg') {
        write('RECV', data);
        return;
      }

      if (!useEncryption) {
        write('RECV-PLAINTEXT', data);
        return;
      }

      try {
        if (!keyRing.length) throw new Error('Kein Schluessel');
        const { v, alg, from, to: dst, room: grp, ts, nonce, aad, ciphertext } = data;
        if (v !== 1 || alg !== 'aes-256-gcm-sha256') throw new Error('Unbekanntes v/alg');

        const aadBytes = Uint8Array.from(atob(aad), (c) => c.charCodeAt(0));
        let ok = false;
        let plaintext = '';
        for (const candidate of keyRing) {
          try {
            plaintext = await decryptUtf8(ciphertext, nonce, candidate, aadBytes);
            ok = true;
            break;
          } catch {}
        }
        if (!ok) throw new Error('GCM-Auth-Fehler oder falscher Schluessel');
        write('RECV-PLAINTEXT', { from, to: dst, room: grp, text: plaintext, ts });
      } catch (error) {
        write('RECV-ERROR', String(error));
      }
    });

    ws.addEventListener('close', () => {
      write('CLOSE', 'Verbindung geschlossen');
      setConn(false);
    });

    ws.addEventListener('error', () => {
      write('ERROR', 'WebSocket Fehler');
    });
  }

  function disconnect() {
    try { ws?.close(); } catch {}
  }

  async function applyPass() {
    if (!pass) {
      alert('Passphrase ist erforderlich');
      return;
    }
    try {
      const derived = await deriveKeyFromPassphrase(pass);
      setKey(derived);
      write('KEY-UPDATE', 'Passphrase angewendet');
    } catch {
      write('KEY-ERROR', 'Schluesselableitung fehlgeschlagen');
    }
  }

  async function send() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!to && !room) {
      alert('Bitte "An User" oder "An Room" ausfuellen.');
      return;
    }

    if (!useEncryption) {
      const payload: any = { type: 'msg', text, ts: Date.now() };
      if (to) payload.to = to;
      if (room) payload.room = room;
      ws.send(JSON.stringify(payload));
      write('SEND', payload);
      return;
    }

    if (!keyRing.length) {
      alert('Kein Schluessel');
      return;
    }

    const header = headerFor(userId, to, room);
    const aadBytes = aadBytesFor(header);

    try {
      const { nonceB64, ciphertextB64 } = await encryptUtf8(text, keyRing[0], aadBytes);
      const aadB64 = btoa(String.fromCharCode(...aadBytes));
      const msg = { type: 'msg', ...header, aad: aadB64, nonce: nonceB64, ciphertext: ciphertextB64 };
      ws.send(JSON.stringify(msg));
      write('SEND', msg);
    } catch (error) {
      write('ENCRYPT-ERROR', String(error));
    }
  }
</script>

<style>
  :root { color-scheme: light dark; }
  main { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 16px; line-height: 1.35; }
  fieldset { border: 1px solid #8884; border-radius: 8px; padding: 12px; margin: 0; }
  fieldset + fieldset { margin-top: 12px; }
  legend { padding: 0 6px; }
  label { display: block; margin: 6px 0 4px; font-size: .95rem; }
  input, textarea { width: 100%; padding: 8px; border: 1px solid #8886; border-radius: 6px; font-family: inherit; }
  textarea { min-height: 80px; }
  button { padding: 8px 12px; border-radius: 6px; border: 1px solid #6666; background: #eee; cursor: pointer; }
  button[disabled] { opacity: .6; cursor: not-allowed; }
  .grid-two { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
  .inline { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .flow { display: flex; flex-direction: column; gap: 8px; }
  .hint { color: #666; font-size: .9rem; }
  .hint.small { font-size: .8rem; }
  .status { font-size: .95rem; color: #a00; }
  .status.ok { color: #0a0; }
  .note { background: #0000000f; padding: 8px; border-radius: 6px; }
  #log { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; white-space: pre-wrap; background: #00000010; padding: 10px; border-radius: 8px; flex: 1 1 auto; overflow: auto; }
  .layout { display: grid; grid-template-columns: minmax(260px, 1fr) minmax(260px, 1fr); gap: 16px; }
  .panel-stack { display: flex; flex-direction: column; gap: 12px; }
  .log-fieldset { display: flex; flex-direction: column; gap: 10px; min-height: 100%; }
  @media (max-width: 880px) {
    .layout { grid-template-columns: 1fr; }
    #log { max-height: 45vh; }
  }
</style>

<main>
  <h1>chaa-i - Svelte Client</h1>
  <p class="hint">Unterstuetzt Klartext und AES-256-GCM (Passphrase -> SHA-256). Konfiguration wird lokal gespeichert.</p>

  <div class="layout">
    <div class="panel-stack">
      <fieldset>
        <legend>Grundkonfiguration</legend>
        <div class="grid-two">
          <label>Serveradresse
            <input bind:value={url} placeholder="ws://host:port/ws" />
          </label>
          <label>Username
            <input bind:value={userId} />
          </label>
        </div>
        <div class="grid-two">
          <label>Standard-Rooms (Komma getrennt)
            <input bind:value={rooms} placeholder="z.b. general,dev" />
          </label>
          <label>
            <span>Verschluesselung</span>
            <div class="inline">
              <label><input type="checkbox" bind:checked={useEncryption} /> aktiv</label>
            </div>
          </label>
        </div>
        {#if useEncryption}
          <div class="grid-two">
            <label>Passphrase
              <input type="password" bind:value={pass} />
            </label>
            <div class="flow">
              <button on:click={applyPass}>Passphrase anwenden</button>
              <span class="hint small">Username, Serveradresse und Passphrase werden lokal gespeichert.</span>
            </div>
          </div>
        {:else}
          <div class="note hint small">Klartextmodus aktiv. Nachrichten werden ohne AES-GCM versendet.</div>
        {/if}
      </fieldset>

      <fieldset>
        <legend>Verbindung</legend>
        <div class="inline">
          <button on:click={connect} disabled={connected}>Verbinden</button>
          <button on:click={disconnect} disabled={!connected}>Trennen</button>
          <span class={statusClass}>{status}</span>
        </div>
      </fieldset>

      <fieldset>
        <legend>Nachricht senden</legend>
        <div class="grid-two">
          <label>An User (optional)
            <input bind:value={to} placeholder="userId" />
          </label>
          <label>An Room (optional)
            <input bind:value={room} placeholder="room" />
          </label>
        </div>
        <label>Nachricht
          <textarea bind:value={text} placeholder="Nachricht..."></textarea>
        </label>
        <div class="inline">
          <button on:click={send} disabled={!connected}>Senden</button>
        </div>
      </fieldset>
    </div>

    <fieldset class="log-fieldset">
      <legend>Log</legend>
      <div id="log">{#each log as line}<div>{line}</div>{/each}</div>
    </fieldset>
  </div>
</main>

