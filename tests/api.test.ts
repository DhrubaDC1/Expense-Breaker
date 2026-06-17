import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';

// ─── Seed data ─────────────────────────────────────────────────────────────
const USER_UID   = 'test-uid-123';
const GOOD_TOKEN = 'clg_live_TestTokenAAAABBBBCCCCDDDDEEEEFFFF';
const GOOD_HASH  = crypto.createHash('sha256').update(GOOD_TOKEN).digest('hex');

const OTHER_UID  = 'other-uid-999';

/** 10-expense seed for summary tests */
const SEED_EXPENSES = [
  { id: 'e1',  amount: 100, currency: 'BDT', category: 'Food & Dining', date: '2026-06-01', type: 'expense', note: '', isEncrypted: false, userId: USER_UID, updatedAt: '2026-06-01T00:00:00Z' },
  { id: 'e2',  amount: 200, currency: 'BDT', category: 'Food & Dining', date: '2026-06-02', type: 'expense', note: '', isEncrypted: false, userId: USER_UID, updatedAt: '2026-06-02T00:00:00Z' },
  { id: 'e3',  amount: 150, currency: 'BDT', category: 'Transport',     date: '2026-06-03', type: 'expense', note: '', isEncrypted: false, userId: USER_UID, updatedAt: '2026-06-03T00:00:00Z' },
  { id: 'e4',  amount: 300, currency: 'BDT', category: 'Shopping',      date: '2026-06-04', type: 'expense', note: '', isEncrypted: false, userId: USER_UID, updatedAt: '2026-06-04T00:00:00Z' },
  { id: 'e5',  amount:  50, currency: 'BDT', category: 'Food & Dining', date: '2026-06-05', type: 'expense', note: '', isEncrypted: false, userId: USER_UID, updatedAt: '2026-06-05T00:00:00Z' },
  { id: 'e6',  amount: 400, currency: 'BDT', category: 'Shopping',      date: '2026-06-06', type: 'expense', note: '', isEncrypted: false, userId: USER_UID, updatedAt: '2026-06-06T00:00:00Z' },
  { id: 'e7',  amount:  75, currency: 'BDT', category: 'Health',        date: '2026-06-07', type: 'expense', note: '', isEncrypted: false, userId: USER_UID, updatedAt: '2026-06-07T00:00:00Z' },
  { id: 'e8',  amount: 500, currency: 'BDT', category: 'Entertainment',  date: '2026-06-08', type: 'expense', note: '', isEncrypted: false, userId: USER_UID, updatedAt: '2026-06-08T00:00:00Z' },
  { id: 'e9',  amount: 125, currency: 'BDT', category: 'Utilities',     date: '2026-06-09', type: 'expense', note: '', isEncrypted: false, userId: USER_UID, updatedAt: '2026-06-09T00:00:00Z' },
  { id: 'e10', amount: 225, currency: 'BDT', category: 'Transport',     date: '2026-06-10', type: 'expense', note: '', isEncrypted: false, userId: USER_UID, updatedAt: '2026-06-10T00:00:00Z' },
];

// Expense owned by a different user
const OTHER_EXPENSE = {
  id: 'other-e1', amount: 999, currency: 'BDT', category: 'Other',
  date: '2026-06-01', type: 'expense', note: '', isEncrypted: false,
  userId: OTHER_UID, updatedAt: '2026-06-01T00:00:00Z',
};

// ─── Firebase Admin mock ───────────────────────────────────────────────────
const fakeStore: Record<string, Record<string, unknown>> = {};

function makeFakeDoc(path: string) {
  const data = fakeStore[path];
  return {
    exists: data !== undefined,
    id: path.split('/').at(-1)!,
    data: () => data,
    ref: { set: vi.fn(), delete: vi.fn() },
  };
}

function makeFakeSnap(items: typeof SEED_EXPENSES) {
  return {
    docs: items.map(e => ({
      id: e.id,
      exists: true,
      data: () => e,
    })),
    empty: items.length === 0,
  };
}

vi.mock('../api/_lib/admin', () => {
  const mockDb: any = {
    doc: vi.fn((path: string) => ({
      get: vi.fn(async () => makeFakeDoc(path)),
      set: vi.fn(async (data: Record<string, unknown>, opts?: any) => {
        fakeStore[path] = opts?.merge ? { ...fakeStore[path], ...data } : data;
      }),
      delete: vi.fn(async () => { delete fakeStore[path]; }),
      ref: { set: vi.fn(), delete: vi.fn() },
    })),
    collection: vi.fn((coll: string) => ({
      where:    vi.fn().mockReturnThis(),
      orderBy:  vi.fn().mockReturnThis(),
      limit:    vi.fn().mockReturnThis(),
      doc:      vi.fn((id: string) => mockDb.doc(`${coll}/${id}`)),
      get: vi.fn(async () => {
        if (coll.includes('/transactions')) {
          return makeFakeSnap(SEED_EXPENSES);
        }
        return makeFakeSnap([]);
      }),
    })),
    batch: vi.fn(() => ({
      set:    vi.fn(),
      commit: vi.fn(async () => {}),
    })),
  };

  const mockAuth: any = {
    getUser: vi.fn(async (uid: string) => ({
      uid,
      email:       uid === USER_UID ? 'test@example.com' : 'other@example.com',
      displayName: uid === USER_UID ? 'Test User'        : 'Other User',
      metadata:    { creationTime: '2026-01-01T00:00:00Z' },
    })),
  };

  return { adminDb: () => mockDb, adminAuth: () => mockAuth };
});

// Seed token and user doc into fakeStore before importing app
fakeStore[`apiTokens/${GOOD_HASH}`] = { uid: USER_UID, createdAt: '2026-01-01T00:00:00Z' };
fakeStore[`users/${USER_UID}`]       = { apiTokenHash: GOOD_HASH, apiTokenCreatedAt: '2026-01-01T00:00:00Z' };
fakeStore[`users/${OTHER_UID}/transactions/${OTHER_EXPENSE.id}`] = OTHER_EXPENSE;

// ─── Import app AFTER mocks ────────────────────────────────────────────────
const { app } = await import('../api/_v1');

// ─── Test suites ───────────────────────────────────────────────────────────
describe('Auth', () => {
  it('missing token → 401', async () => {
    const res = await request(app).get('/api/v1/me');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: 'invalid_token' });
  });

  it('bad token → 401', async () => {
    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer clg_live_this_is_totally_wrong');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: 'invalid_token' });
  });

  it('good token → GET /api/v1/me returns 200 with user object', async () => {
    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${GOOD_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id:    USER_UID,
      email: 'test@example.com',
      name:  'Test User',
    });
    expect(res.body).toHaveProperty('created_at');
    expect(res.body).toHaveProperty('token_created_at');
  });
});

describe('POST /api/v1/expenses', () => {
  it('valid body → 201 with created expense', async () => {
    const res = await request(app)
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${GOOD_TOKEN}`)
      .send({
        amount:      500,
        currency:    'BDT',
        category_id: '1',
        description: 'Test lunch',
        occurred_at: '2026-06-01T10:00:00Z',
      });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      amount:   500,
      currency: 'BDT',
      category: { id: '1', name: 'Food & Dining' },
    });
    expect(res.body).toHaveProperty('id');
  });

  it('amount=0 → 400', async () => {
    const res = await request(app)
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${GOOD_TOKEN}`)
      .send({
        amount:      0,
        currency:    'BDT',
        category_id: '1',
        occurred_at: '2026-06-17T10:00:00Z',
      });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'invalid_value', field: 'amount' });
  });

  it('future occurred_at → 400', async () => {
    const res = await request(app)
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${GOOD_TOKEN}`)
      .send({
        amount:      100,
        currency:    'BDT',
        category_id: '1',
        occurred_at: '2099-01-01T00:00:00Z',
      });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ field: 'occurred_at' });
  });
});

describe('GET /api/v1/expenses/summary', () => {
  it('group_by=category returns correct totals for seed dataset', async () => {
    const res = await request(app)
      .get('/api/v1/expenses/summary?group_by=category&from=2026-06-01&to=2026-06-10')
      .set('Authorization', `Bearer ${GOOD_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(
      SEED_EXPENSES.reduce((s, e) => s + e.amount, 0),
    );

    const groups: { key: string; label: string; total: number; count: number }[] = res.body.groups;
    const food = groups.find(g => g.label === 'Food & Dining')!;
    expect(food).toBeDefined();
    expect(food.total).toBe(100 + 200 + 50);  // e1 + e2 + e5
    expect(food.count).toBe(3);

    const shopping = groups.find(g => g.label === 'Shopping')!;
    expect(shopping.total).toBe(300 + 400);    // e4 + e6
    expect(shopping.count).toBe(2);
  });
});

describe('DELETE /api/v1/expenses/:id', () => {
  it("deleting another user's expense → 404", async () => {
    const res = await request(app)
      .delete(`/api/v1/expenses/${OTHER_EXPENSE.id}`)
      .set('Authorization', `Bearer ${GOOD_TOKEN}`);
    expect(res.status).toBe(404);
  });
});
