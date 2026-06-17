import { webcrypto } from 'node:crypto';

const subtle = webcrypto.subtle as SubtleCrypto;

async function getKey(userId: string): Promise<CryptoKey> {
  const raw = Buffer.from(userId.padEnd(32, '0').slice(0, 32));
  return subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptNote(data: string, userId: string): Promise<string> {
  const key = await getKey(userId);
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const enc = await subtle.encrypt({ name: 'AES-GCM', iv }, key, Buffer.from(data, 'utf8'));
  const combined = Buffer.concat([Buffer.from(iv), Buffer.from(enc)]);
  return combined.toString('base64');
}

export async function decryptNote(base64: string, userId: string): Promise<string> {
  try {
    const key = await getKey(userId);
    const combined = Buffer.from(base64, 'base64');
    const iv = combined.subarray(0, 12);
    const data = combined.subarray(12);
    const dec = await subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return Buffer.from(dec).toString('utf8');
  } catch {
    return '';
  }
}
