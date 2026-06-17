<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ClearLedger

Premium personal expense manager PWA with AI-powered insights.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Create `.env.local` with `GROQ_API_KEY=your_key`
3. Run the dev server: `npm run dev`

## External API

ClearLedger exposes a token-authenticated REST API at `/api/v1/*` so external agents (e.g. Hermes) can read and write expenses programmatically.

### Get a token

1. Open the app → **Settings → Hermes API**.
2. Click **Generate API Token**. Copy the displayed token — it is shown **once**.
3. Token format: `clg_live_<32 base-62 chars>`. One active token per account.

### Vercel deployment env vars

| Variable | Description |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | JSON of a Firebase service account (Project → Service accounts → Generate key). Required for the API to authenticate Firestore reads/writes. |

### curl example

```bash
TOKEN="clg_live_<your-token>"
BASE="https://expense-breaker.vercel.app"

# Profile
curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/v1/me | jq

# List expenses (last 7 days)
FROM=$(date -v-7d +%Y-%m-%d)
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/expenses?from=$FROM&limit=20" | jq

# Add an expense
curl -s -X POST $BASE/api/v1/expenses \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"amount":350,"currency":"BDT","category_id":"1","description":"Lunch","occurred_at":"2026-06-17T12:00:00Z"}' | jq

# Monthly summary grouped by category
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE/api/v1/expenses/summary?group_by=category&from=2026-06-01&to=2026-06-30" | jq
```

Full endpoint reference: `GET /api/v1/docs`

### Rate limit

60 requests / minute per token. Exceeded requests return `429` with a `Retry-After` header.

### Running tests

```bash
npm test
```
