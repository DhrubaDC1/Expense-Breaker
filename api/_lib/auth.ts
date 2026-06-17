import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { adminDb } from './admin';
import { checkRateLimit } from './rateLimit';

export interface AuthedRequest extends Request {
  uid: string;
  tokenHash: string;
}

export async function requireToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization ?? '';
  const raw = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!raw) { res.status(401).json({ error: 'invalid_token' }); return; }

  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');

  let uid: string;
  try {
    const db = await adminDb();
    const snap = await db.doc(`apiTokens/${tokenHash}`).get();
    if (!snap.exists) { res.status(401).json({ error: 'invalid_token' }); return; }
    uid = snap.data()!.uid;
  } catch (e: any) {
    // Surface Firebase init errors as 503 (misconfigured server) not 401
    const msg = e?.message ?? String(e);
    res.status(503).json({ error: 'service_unavailable', detail: msg });
    return;
  }

  const rl = checkRateLimit(tokenHash);
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfter));
    res.status(429).json({ error: 'rate_limit_exceeded' });
    return;
  }

  (req as AuthedRequest).uid = uid;
  (req as AuthedRequest).tokenHash = tokenHash;
  next();
}
