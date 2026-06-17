// api/_v1.ts
import express from "express";
import crypto2 from "node:crypto";

// api/_lib/admin.ts
var _db = null;
var _auth = null;
var _ready = false;
async function ensureInit() {
  if (_ready) return;
  const { initializeApp, cert, getApps } = await import("firebase-admin/app");
  if (getApps().length === 0) {
    const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!svc) throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not set");
    initializeApp({ credential: cert(JSON.parse(svc)) });
  }
  _ready = true;
}
async function adminDb() {
  if (!_db) {
    await ensureInit();
    const { getFirestore } = await import("firebase-admin/firestore");
    _db = getFirestore();
  }
  return _db;
}
async function adminAuth() {
  if (!_auth) {
    await ensureInit();
    const { getAuth } = await import("firebase-admin/auth");
    _auth = getAuth();
  }
  return _auth;
}

// api/_lib/auth.ts
import crypto from "node:crypto";

// api/_lib/rateLimit.ts
var store = /* @__PURE__ */ new Map();
function checkRateLimit(key, limit = 60, windowMs = 6e4) {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.reset - now) / 1e3) };
  }
  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

// api/_lib/auth.ts
async function requireToken(req, res, next) {
  const header = req.headers.authorization ?? "";
  const raw = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!raw) {
    res.status(401).json({ error: "invalid_token" });
    return;
  }
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  let uid;
  try {
    const db = await adminDb();
    const snap = await db.doc(`apiTokens/${tokenHash}`).get();
    if (!snap.exists) {
      res.status(401).json({ error: "invalid_token" });
      return;
    }
    uid = snap.data().uid;
  } catch (e) {
    const msg = e?.message ?? String(e);
    res.status(503).json({ error: "service_unavailable", detail: msg });
    return;
  }
  const rl = checkRateLimit(tokenHash);
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    res.status(429).json({ error: "rate_limit_exceeded" });
    return;
  }
  req.uid = uid;
  req.tokenHash = tokenHash;
  next();
}

// api/_lib/cryptoNode.ts
import { webcrypto } from "node:crypto";
var subtle = webcrypto.subtle;
async function getKey(userId) {
  const raw = Buffer.from(userId.padEnd(32, "0").slice(0, 32));
  return subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function encryptNote(data, userId) {
  const key = await getKey(userId);
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const enc = await subtle.encrypt({ name: "AES-GCM", iv }, key, Buffer.from(data, "utf8"));
  const combined = Buffer.concat([Buffer.from(iv), Buffer.from(enc)]);
  return combined.toString("base64");
}
async function decryptNote(base64, userId) {
  try {
    const key = await getKey(userId);
    const combined = Buffer.from(base64, "base64");
    const iv = combined.subarray(0, 12);
    const data = combined.subarray(12);
    const dec = await subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return Buffer.from(dec).toString("utf8");
  } catch {
    return "";
  }
}

// api/_v1.ts
var CATEGORIES = [
  { id: "1", name: "Food & Dining", icon: "Utensils", color: "#f87171", is_default: true },
  { id: "2", name: "Transport", icon: "Car", color: "#fb923c", is_default: true },
  { id: "3", name: "Entertainment", icon: "Film", color: "#facc15", is_default: true },
  { id: "4", name: "Shopping", icon: "ShoppingBag", color: "#4ade80", is_default: true },
  { id: "5", name: "Utilities", icon: "Zap", color: "#2dd4bf", is_default: true },
  { id: "6", name: "Health", icon: "Heart", color: "#3b82f6", is_default: true },
  { id: "7", name: "Other", icon: "MoreHorizontal", color: "#94a3b8", is_default: true },
  { id: "8", name: "Salary", icon: "DollarSign", color: "#10b981", is_default: true },
  { id: "9", name: "Freelance", icon: "Briefcase", color: "#8b5cf6", is_default: true },
  { id: "10", name: "Investment", icon: "TrendingUp", color: "#ec4899", is_default: true }
];
var app = express();
app.use(express.json());
var ALLOWED = [/^https:\/\/[^/]*\.tryhermes\.top$/, /^http:\/\/localhost(:\d+)?$/];
app.use((req, res, next) => {
  const origin = req.headers.origin ?? "";
  if (ALLOWED.some((r) => r.test(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const prefix = req.tokenHash?.slice(0, 8) ?? "no-token";
    console.log(JSON.stringify({
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      tok: prefix,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start
    }));
  });
  next();
});
function parsePagination(query) {
  const limit = Math.min(Number(query.limit ?? 50), 500);
  const offset = Math.max(Number(query.offset ?? 0), 0);
  return { limit, offset };
}
function dateStr(iso) {
  return iso.slice(0, 10);
}
async function getCategoryById(uid, id) {
  const builtin = CATEGORIES.find((c) => c.id === id);
  if (builtin) return builtin;
  const snap = await (await adminDb()).doc(`users/${uid}/categories/${id}`).get();
  if (snap.exists) return { id, is_default: false, ...snap.data() };
  return null;
}
async function shapeTransaction(doc, uid) {
  const d = doc.data();
  let description = d.note ?? "";
  if (d.isEncrypted && description) {
    description = await decryptNote(description, uid);
  }
  const cat = CATEGORIES.find((c) => c.name === d.category) ?? null;
  return {
    id: doc.id,
    amount: d.amount,
    currency: d.currency,
    category: cat ? { id: cat.id, name: cat.name } : { id: "unknown", name: d.category },
    description,
    occurred_at: (/* @__PURE__ */ new Date(d.date + "T00:00:00Z")).toISOString(),
    created_at: d.createdAt ?? d.updatedAt ?? null,
    updated_at: d.updatedAt ?? null,
    type: d.type
  };
}
app.get("/api/v1/me", requireToken, async (req, res) => {
  const { uid } = req;
  const [db, auth] = await Promise.all([adminDb(), adminAuth()]);
  const [user, userDoc] = await Promise.all([
    auth.getUser(uid),
    db.doc(`users/${uid}`).get()
  ]);
  res.json({
    id: user.uid,
    email: user.email ?? null,
    name: user.displayName ?? null,
    created_at: user.metadata.creationTime ?? null,
    token_created_at: userDoc.data()?.apiTokenCreatedAt ?? null
  });
});
app.get("/api/v1/expenses", requireToken, async (req, res) => {
  const { uid } = req;
  const { from, to, category_id } = req.query;
  const { limit, offset } = parsePagination(req.query);
  const db = await adminDb();
  let q = db.collection(`users/${uid}/transactions`).orderBy("date", "desc");
  if (from) q = q.where("date", ">=", from);
  if (to) q = q.where("date", "<=", to);
  const snap = await q.get();
  let docs = snap.docs;
  if (category_id) {
    const cat = await getCategoryById(uid, category_id);
    docs = cat ? docs.filter((d) => d.data().category === cat.name) : [];
  }
  const total = docs.length;
  const page = docs.slice(offset, offset + limit);
  const items = await Promise.all(page.map((d) => shapeTransaction(d, uid)));
  res.json({ items, total, limit, offset });
});
app.post("/api/v1/expenses", requireToken, async (req, res) => {
  const { uid } = req;
  const { amount, currency, category_id, description, occurred_at } = req.body ?? {};
  if (typeof amount !== "number" || amount <= 0) {
    res.status(400).json({ error: "invalid_value", field: "amount", message: "amount must be > 0" });
    return;
  }
  if (!occurred_at || new Date(occurred_at) > /* @__PURE__ */ new Date()) {
    res.status(400).json({ error: "invalid_value", field: "occurred_at", message: "occurred_at must be <= now" });
    return;
  }
  const cat = category_id ? await getCategoryById(uid, String(category_id)) : null;
  if (category_id && !cat) {
    res.status(400).json({ error: "invalid_value", field: "category_id", message: "category not found" });
    return;
  }
  if (!currency || typeof currency !== "string" || currency.length !== 3) {
    res.status(400).json({ error: "invalid_value", field: "currency", message: "currency must be a 3-char ISO code" });
    return;
  }
  const id = crypto2.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const dateOnly = dateStr(occurred_at);
  const db = await adminDb();
  let note = description ?? "";
  let isEncrypted = false;
  if (note) {
    note = await encryptNote(note, uid);
    isEncrypted = true;
  }
  const data = {
    amount,
    currency,
    category: cat?.name ?? "Other",
    date: dateOnly,
    note,
    isEncrypted,
    type: "expense",
    userId: uid,
    createdAt: now,
    updatedAt: now,
    exchangeRateAtEntry: 1
  };
  const docRef = db.doc(`users/${uid}/transactions/${id}`);
  await docRef.set(data);
  const snap = await docRef.get();
  res.status(201).json(await shapeTransaction(snap, uid));
});
app.get("/api/v1/expenses/summary", requireToken, async (req, res) => {
  const { uid } = req;
  const { from, to, group_by = "category" } = req.query;
  const db = await adminDb();
  let q = db.collection(`users/${uid}/transactions`).where("type", "==", "expense").orderBy("date", "asc");
  if (from) q = q.where("date", ">=", from);
  if (to) q = q.where("date", "<=", to);
  const snap = await q.get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  let total = 0;
  const groups = /* @__PURE__ */ new Map();
  for (const d of docs) {
    const amt = Number(d.amount) || 0;
    total += amt;
    let key, label;
    if (group_by === "category") {
      const catName = String(d.category ?? "Other");
      const cat = CATEGORIES.find((c) => c.name === catName);
      key = cat?.id ?? "other";
      label = catName;
    } else if (group_by === "day") {
      key = label = String(d.date ?? "").slice(0, 10);
    } else if (group_by === "week") {
      const date = /* @__PURE__ */ new Date(String(d.date) + "T00:00:00Z");
      const monday = new Date(date);
      monday.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
      key = label = monday.toISOString().slice(0, 10);
    } else {
      key = label = String(d.date ?? "").slice(0, 7);
    }
    const g = groups.get(key) ?? { label, total: 0, count: 0 };
    g.total += amt;
    g.count += 1;
    groups.set(key, g);
  }
  res.json({
    from: from ?? null,
    to: to ?? null,
    total,
    groups: [...groups.entries()].map(([k, v]) => ({ key: k, ...v }))
  });
});
app.patch("/api/v1/expenses/:id", requireToken, async (req, res) => {
  const { uid } = req;
  const db = await adminDb();
  const ref = db.doc(`users/${uid}/transactions/${req.params.id}`);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.userId !== uid) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const { amount, currency, category_id, description, occurred_at } = req.body ?? {};
  const update = { updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  if (amount !== void 0) {
    if (typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ error: "invalid_value", field: "amount" });
      return;
    }
    update.amount = amount;
  }
  if (currency !== void 0) update.currency = currency;
  if (occurred_at !== void 0) update.date = dateStr(occurred_at);
  if (category_id !== void 0) {
    const cat = await getCategoryById(uid, String(category_id));
    if (!cat) {
      res.status(400).json({ error: "invalid_value", field: "category_id" });
      return;
    }
    update.category = cat.name;
  }
  if (description !== void 0) {
    update.note = description ? await encryptNote(description, uid) : "";
    update.isEncrypted = !!description;
  }
  await ref.set(update, { merge: true });
  res.json(await shapeTransaction(await ref.get(), uid));
});
app.delete("/api/v1/expenses/:id", requireToken, async (req, res) => {
  const { uid } = req;
  const db = await adminDb();
  const ref = db.doc(`users/${uid}/transactions/${req.params.id}`);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.userId !== uid) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  await ref.delete();
  res.status(204).end();
});
app.get("/api/v1/categories", requireToken, async (req, res) => {
  const { uid } = req;
  const db = await adminDb();
  const snap = await db.collection(`users/${uid}/categories`).get();
  const custom = snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name,
    color: d.data().color ?? "#94a3b8",
    icon: d.data().icon ?? "MoreHorizontal",
    is_default: false
  }));
  res.json([...CATEGORIES, ...custom]);
});
app.post("/api/v1/categories", requireToken, async (req, res) => {
  const { uid } = req;
  const { name, color, icon } = req.body ?? {};
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "invalid_value", field: "name", message: "name is required" });
    return;
  }
  const db = await adminDb();
  const id = crypto2.randomUUID();
  const data = { name, color: color ?? "#94a3b8", icon: icon ?? "MoreHorizontal" };
  await db.doc(`users/${uid}/categories/${id}`).set(data);
  res.status(201).json({ id, is_default: false, ...data });
});
app.get("/api/v1/budgets", requireToken, async (req, res) => {
  const { uid } = req;
  const month = String(req.query.month ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 7));
  const db = await adminDb();
  const snap = await db.collection(`users/${uid}/budgets`).where("month", "==", month).get();
  const byCategory = snap.docs.map((d) => ({ category_id: d.data().categoryId, limit: d.data().amount }));
  res.json({ month, total_budget: byCategory.reduce((s, b) => s + b.limit, 0), by_category: byCategory });
});
app.post("/api/v1/budgets", requireToken, async (req, res) => {
  const { uid } = req;
  const { month, total_budget, by_category } = req.body ?? {};
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    res.status(400).json({ error: "invalid_value", field: "month", message: "month must be YYYY-MM" });
    return;
  }
  const db = await adminDb();
  const batch = db.batch();
  if (Array.isArray(by_category)) {
    for (const entry of by_category) {
      const existSnap = await db.collection(`users/${uid}/budgets`).where("month", "==", month).where("categoryId", "==", entry.category_id).limit(1).get();
      if (!existSnap.empty) {
        batch.set(existSnap.docs[0].ref, { amount: entry.limit }, { merge: true });
      } else {
        const ref = db.collection(`users/${uid}/budgets`).doc();
        batch.set(ref, {
          categoryId: entry.category_id,
          amount: entry.limit,
          month,
          userId: uid
        });
      }
    }
  } else if (typeof total_budget === "number") {
    const ref = db.collection(`users/${uid}/budgets`).doc(`total-${month}`);
    batch.set(ref, { categoryId: "_total", amount: total_budget, month, userId: uid });
  }
  await batch.commit();
  res.status(201).json({ month, total_budget: total_budget ?? 0, by_category: by_category ?? [] });
});
app.get("/api/v1/health", (_req, res) => {
  res.json({ ok: true, ts: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/v1/docs", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(DOCS_HTML);
});
var v1_default = app;
var DOCS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>ClearLedger API v1 \u2014 Reference</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#050805;color:#d1fae5;font-family:system-ui,sans-serif;padding:40px 20px;line-height:1.6}
  a{color:#10e5a3;text-decoration:none}
  h1{font-size:2rem;font-weight:700;margin-bottom:4px;background:linear-gradient(135deg,#10e5a3,#9A8CFF);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  h2{font-size:1.1rem;font-weight:600;margin:36px 0 12px;color:#10e5a3;letter-spacing:.05em;text-transform:uppercase}
  h3{font-size:.95rem;font-weight:600;margin:20px 0 6px;color:#d1fae5}
  .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.72rem;font-weight:700;margin-right:8px;font-family:monospace}
  .get{background:#0d3b2e;color:#10e5a3}.post{background:#2a1f00;color:#f59e0b}
  .patch{background:#1e1a3f;color:#9A8CFF}.delete{background:#3b0f0f;color:#f87171}
  pre{background:#0d0f0e;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:16px;overflow-x:auto;font-size:.8rem;color:#a7f3d0;margin:10px 0}
  .endpoint{border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:18px 20px;margin-bottom:16px;background:rgba(255,255,255,.02)}
  .path{font-family:monospace;font-size:.95rem}
  .desc{color:#6b7280;font-size:.85rem;margin-top:4px}
  .section{max-width:800px;margin:0 auto}
  .pill{display:inline-block;background:rgba(16,229,163,.1);border:1px solid rgba(16,229,163,.2);border-radius:6px;padding:2px 8px;font-size:.75rem;color:#10e5a3;margin:2px}
  table{width:100%;border-collapse:collapse;font-size:.82rem;margin:8px 0}
  th{text-align:left;color:#6b7280;padding:4px 8px;border-bottom:1px solid rgba(255,255,255,.06)}
  td{padding:4px 8px;border-bottom:1px solid rgba(255,255,255,.04)}
  code{background:#0d0f0e;border:1px solid rgba(255,255,255,.1);border-radius:4px;padding:1px 5px;font-family:monospace;font-size:.85em}
</style>
</head>
<body>
<div class="section">
<h1>ClearLedger API v1</h1>
<p style="color:#6b7280;margin-bottom:32px">External REST API for Hermes and other agents. All endpoints require a Bearer token.</p>

<h2>Authentication</h2>
<div class="endpoint">
  <p>Generate an API token in <strong>Settings \u2192 Hermes API</strong>. Include it in every request:</p>
  <pre>Authorization: Bearer clg_live_&lt;token&gt;</pre>
  <p class="desc">Tokens are stored hashed (SHA-256). One active token per user. 60 requests / minute.</p>
</div>

<h2>CORS</h2>
<div class="endpoint">
  <p>Allowed origins: <code>https://*.tryhermes.top</code> \xB7 <code>http://localhost:*</code></p>
</div>

<h2>Endpoints</h2>

<div class="endpoint">
  <span class="badge get">GET</span><span class="path">/api/v1/me</span>
  <p class="desc">Returns the authenticated user's profile and token metadata.</p>
  <pre>{ "id", "email", "name", "created_at", "token_created_at" }</pre>
</div>

<div class="endpoint">
  <span class="badge get">GET</span><span class="path">/api/v1/expenses</span>
  <p class="desc">List expenses with optional filters and pagination.</p>
  <table><tr><th>Query param</th><th>Default</th><th>Notes</th></tr>
    <tr><td><code>from</code></td><td>\u2014</td><td>YYYY-MM-DD (inclusive)</td></tr>
    <tr><td><code>to</code></td><td>\u2014</td><td>YYYY-MM-DD (inclusive)</td></tr>
    <tr><td><code>category_id</code></td><td>\u2014</td><td>Filter by category</td></tr>
    <tr><td><code>limit</code></td><td>50</td><td>Max 500</td></tr>
    <tr><td><code>offset</code></td><td>0</td><td></td></tr>
  </table>
  <pre>{ "items": [Expense], "total": number, "limit": number, "offset": number }</pre>
</div>

<div class="endpoint">
  <span class="badge post">POST</span><span class="path">/api/v1/expenses</span>
  <p class="desc">Create a new expense. Returns 201 with the created expense.</p>
  <pre>{ "amount": number, "currency": "BDT", "category_id": "1", "description": "...", "occurred_at": "2026-06-17T10:00:00Z" }</pre>
</div>

<div class="endpoint">
  <span class="badge get">GET</span><span class="path">/api/v1/expenses/summary</span>
  <p class="desc">Aggregated totals grouped by category, day, week, or month.</p>
  <table><tr><th>Query param</th><th>Default</th><th>Values</th></tr>
    <tr><td><code>group_by</code></td><td>category</td><td>category \xB7 day \xB7 week \xB7 month</td></tr>
    <tr><td><code>from</code></td><td>\u2014</td><td>YYYY-MM-DD</td></tr>
    <tr><td><code>to</code></td><td>\u2014</td><td>YYYY-MM-DD</td></tr>
  </table>
  <pre>{ "from", "to", "total": number, "groups": [{ "key", "label", "total", "count" }] }</pre>
</div>

<div class="endpoint">
  <span class="badge patch">PATCH</span><span class="path">/api/v1/expenses/:id</span>
  <p class="desc">Update any subset of editable fields. Returns the updated expense or 404.</p>
  <pre>{ "amount"?, "currency"?, "category_id"?, "description"?, "occurred_at"? }</pre>
</div>

<div class="endpoint">
  <span class="badge delete">DELETE</span><span class="path">/api/v1/expenses/:id</span>
  <p class="desc">Delete an expense. Returns 204. 404 if not found or not owned.</p>
</div>

<div class="endpoint">
  <span class="badge get">GET</span><span class="path">/api/v1/categories</span>
  <p class="desc">List all categories (built-in + user-created).</p>
  <pre>[{ "id", "name", "color", "icon", "is_default" }]</pre>
</div>

<div class="endpoint">
  <span class="badge post">POST</span><span class="path">/api/v1/categories</span>
  <p class="desc">Create a custom category.</p>
  <pre>{ "name": "Gifts", "color"?: "#ec4899", "icon"?: "Gift" }</pre>
</div>

<div class="endpoint">
  <span class="badge get">GET</span><span class="path">/api/v1/budgets</span>
  <p class="desc">Get budget allocations for a month.</p>
  <table><tr><th>Query param</th><th>Default</th></tr>
    <tr><td><code>month</code></td><td>current month (YYYY-MM)</td></tr>
  </table>
  <pre>{ "month": "2026-06", "total_budget": number, "by_category": [{ "category_id", "limit" }] }</pre>
</div>

<div class="endpoint">
  <span class="badge post">POST</span><span class="path">/api/v1/budgets</span>
  <p class="desc">Create or update budget for a month.</p>
  <pre>{ "month": "2026-06", "total_budget"?: number, "by_category"?: [{ "category_id", "limit" }] }</pre>
</div>

<h2>curl example</h2>
<pre>TOKEN="clg_live_&lt;your-token&gt;"
BASE="https://expense-breaker.vercel.app"

# Who am I?
curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/v1/me | jq

# Add an expense
curl -s -X POST $BASE/api/v1/expenses \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"amount":350,"currency":"BDT","category_id":"1","description":"Lunch","occurred_at":"2026-06-17T12:00:00Z"}'

# Monthly summary
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/expenses/summary?group_by=category&from=2026-06-01&to=2026-06-30" | jq</pre>

<h2>Error format</h2>
<pre>{ "error": "invalid_token" }          \u2192 401
{ "error": "rate_limit_exceeded" }    \u2192 429  +  Retry-After: N
{ "error": "invalid_value", "field": "amount", "message": "..." } \u2192 400
{ "error": "not_found" }              \u2192 404</pre>

<p style="margin-top:48px;color:#374151;font-size:.8rem">ClearLedger External API \xB7 <a href="/">Back to app</a></p>
</div>
</body>
</html>`;
export {
  app,
  v1_default as default
};
