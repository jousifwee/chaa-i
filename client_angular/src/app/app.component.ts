import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { deriveKey, buildHeader, aadBytes, encryptUtf8, decryptUtf8, b64encode, b64decode } from './crypto';

const STORAGE_KEY = 'chaa_i_angular_client';
const MAX_LOG = 400;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private readonly fb = inject(FormBuilder);

  readonly configForm = this.fb.nonNullable.group({
    url: 'ws://localhost:8080/ws',
    userId: '',
    rooms: '',
    pass: '',
    useEncryption: true
  });

  readonly messageForm = this.fb.nonNullable.group({
    to: '',
    room: '',
    text: ''
  });

  readonly status = signal('Nicht verbunden');
  readonly statusClass = signal<'ok' | 'idle'>('idle');
  readonly logEntries = signal<string[]>([]);
  readonly connected = signal(false);

  private ws: WebSocket | null = null;
  private keyRing: CryptoKey[] = [];

  constructor() {
    this.restore();

    this.configForm.valueChanges.subscribe(() => {
      this.persist();
      if (!this.configForm.get('useEncryption')!.value) {
        this.keyRing = [];
      }
    });
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.configForm.getRawValue()));
    } catch {
      /* noop */
    }
  }

  private restore() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      this.configForm.patchValue({
        url: raw.url || 'ws://localhost:8080/ws',
        userId: raw.userId || this.randomUserId(),
        rooms: raw.rooms || '',
        pass: raw.pass || '',
        useEncryption: raw.useEncryption !== false
      }, { emitEvent: false });
    } catch {
      this.configForm.patchValue({ userId: this.randomUserId() }, { emitEvent: false });
    }
  }

  private randomUserId() {
    return 'user-' + Math.random().toString(36).slice(2, 8);
  }

  appendLog(kind: string, payload: unknown) {
    const time = new Date().toLocaleTimeString();
    const text = `[${time}] ${kind}: ${typeof payload === 'string' ? payload : JSON.stringify(payload)}`;
    const next = [...this.logEntries(), text].slice(-MAX_LOG);
    this.logEntries.set(next);
    queueMicrotask(() => {
      const logger = document.getElementById('log');
      if (logger) logger.scrollTop = logger.scrollHeight;
    });
  }

  setConnected(flag: boolean) {
    this.connected.set(flag);
    this.status.set(flag ? 'Verbunden' : 'Nicht verbunden');
    this.statusClass.set(flag ? 'ok' : 'idle');
  }

  async connect() {
    const { url, userId, rooms, pass, useEncryption } = this.configForm.getRawValue();
    if (!url || !userId) {
      alert('URL und User-ID sind erforderlich');
      return;
    }

    this.keyRing = [];
    if (useEncryption) {
      if (!pass) {
        alert('Passphrase ist erforderlich');
        return;
      }
      try {
        this.keyRing.unshift(await deriveKey(pass));
      } catch {
        alert('Schluesselableitung fehlgeschlagen');
        return;
      }
    }

    try {
      this.ws?.close();
    } catch {
      /* noop */
    }

    const socket = new WebSocket(url);
    this.ws = socket;

    socket.addEventListener('open', () => {
      this.setConnected(true);
      this.appendLog('OPEN', url);
      const joinRooms = rooms
        ?.split(',')
        .map((token) => token.trim())
        .filter(Boolean);
      const join = { type: 'join', userId, rooms: joinRooms?.length ? joinRooms : undefined };
      socket.send(JSON.stringify(join));
      this.appendLog('SEND', join);
    });

    socket.addEventListener('message', async (event) => {
      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch {
        this.appendLog('RECV', event.data);
        return;
      }

      if (data.type !== 'msg') {
        this.appendLog('RECV', data);
        return;
      }

      if (!this.configForm.get('useEncryption')!.value) {
        this.appendLog('RECV-PLAINTEXT', data);
        return;
      }

      try {
        if (!this.keyRing.length) throw new Error('Kein Schluessel');
        const { v, alg, from, to, room, ts, nonce, aad, ciphertext } = data;
        if (v !== 1 || alg !== 'aes-256-gcm-sha256') throw new Error('Unbekanntes v/alg');
        const aadBuffer = b64decode(aad);
        let ok = false;
        let plaintext = '';
        for (const candidate of this.keyRing) {
          try {
            plaintext = await decryptUtf8(ciphertext, nonce, candidate, aadBuffer);
            ok = true;
            break;
          } catch {
            /* continue */
          }
        }
        if (!ok) throw new Error('GCM-Auth-Fehler oder falscher Schluessel');
        this.appendLog('RECV-PLAINTEXT', { from, to, room, text: plaintext, ts });
      } catch (error) {
        this.appendLog('RECV-ERROR', String(error));
      }
    });

    socket.addEventListener('close', () => {
      this.appendLog('CLOSE', 'Verbindung geschlossen');
      this.setConnected(false);
    });

    socket.addEventListener('error', () => {
      this.appendLog('ERROR', 'WebSocket Fehler');
    });
  }

  disconnect() {
    try {
      this.ws?.close();
    } catch {
      /* noop */
    }
  }

  async applyPassphrase() {
    const pass = this.configForm.get('pass')!.value;
    if (!pass) {
      alert('Passphrase ist erforderlich');
      return;
    }
    try {
      const key = await deriveKey(pass);
      this.keyRing.unshift(key);
      if (this.keyRing.length > 5) this.keyRing.pop();
      this.appendLog('KEY-UPDATE', 'Passphrase angewendet');
    } catch {
      this.appendLog('KEY-ERROR', 'Schluesselableitung fehlgeschlagen');
    }
  }

  async sendMessage() {
    const socket = this.ws;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const { to, room, text } = this.messageForm.getRawValue();
    if (!to && !room) {
      alert('Bitte "An User" oder "An Room" ausfuellen.');
      return;
    }

    if (!this.configForm.get('useEncryption')!.value) {
      const payload: any = { type: 'msg', text, ts: Date.now() };
      if (to) payload.to = to;
      if (room) payload.room = room;
      socket.send(JSON.stringify(payload));
      this.appendLog('SEND', payload);
      return;
    }

    if (!this.keyRing.length) {
      alert('Kein Schluessel');
      return;
    }

    const header = buildHeader(
      this.configForm.get('userId')!.value,
      to || undefined,
      room || undefined
    );
    const aad = aadBytes(header);

    try {
      const { nonceB64, ciphertextB64 } = await encryptUtf8(text, this.keyRing[0], aad);
      const message = { type: 'msg', ...header, aad: b64encode(aad), nonce: nonceB64, ciphertext: ciphertextB64 };
      socket.send(JSON.stringify(message));
      this.appendLog('SEND', message);
    } catch (error) {
      this.appendLog('ENCRYPT-ERROR', String(error));
    }
  }
}
