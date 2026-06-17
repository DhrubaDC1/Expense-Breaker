// Lazy-load firebase-admin so module-level failures don't crash the
// entire function (which would break even unauthenticated endpoints).
type DB   = import('firebase-admin/firestore').Firestore;
type Auth = import('firebase-admin/auth').Auth;

let _db: DB | null = null;
let _auth: Auth | null = null;
let _ready = false;

async function ensureInit() {
  if (_ready) return;
  const { initializeApp, cert, getApps } = await import('firebase-admin/app');
  if (getApps().length === 0) {
    const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!svc) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
    initializeApp({ credential: cert(JSON.parse(svc)) });
  }
  _ready = true;
}

export async function adminDb(): Promise<DB> {
  if (!_db) {
    await ensureInit();
    const { getFirestore } = await import('firebase-admin/firestore');
    _db = getFirestore();
  }
  return _db;
}

export async function adminAuth(): Promise<Auth> {
  if (!_auth) {
    await ensureInit();
    const { getAuth } = await import('firebase-admin/auth');
    _auth = getAuth();
  }
  return _auth;
}
