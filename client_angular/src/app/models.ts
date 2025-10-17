export type AppMode = 'advanced' | 'simple' | 'diagnostic';

export interface SimpleLogEntry {
  direction: 'SEND' | 'RECV';
  text: string;
  to?: string;
  from?: string;
  ts: number;
}

export interface DiagnosticLogEntry {
  direction: 'SEND' | 'RECV';
  ts: number;
  plaintextLength: number;
  ciphertextLength: number;
  aadLength: number;
  nonceLength: number;
  header: Record<string, unknown>;
  aadPreview: string;
  notes?: string;
}
