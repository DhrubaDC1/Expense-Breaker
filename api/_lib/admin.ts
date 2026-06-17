import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';

let _db: Firestore | null = null;
let _auth: Auth | null = null;

function ensureInit() {
  if (getApps().length === 0) {
    const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
    initializeApp(svc ? { credential: cert(JSON.parse(svc)) } : undefined);
  }
}

export function adminDb(): Firestore {
  if (!_db) { ensureInit(); _db = getFirestore(); }
  return _db;
}

export function adminAuth(): Auth {
  if (!_auth) { ensureInit(); _auth = getAuth(); }
  return _auth;
}
