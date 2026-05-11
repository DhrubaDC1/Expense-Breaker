# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**ClearLedger** — a PWA expense manager. The repo directory is named `Expense-Breaker`; the product name is ClearLedger throughout the UI and metadata.

## Commands

```bash
npm run dev        # dev server on http://localhost:3000
npm run build      # production build (output: dist/)
npm run lint       # TypeScript type-check only (tsc --noEmit, no eslint)
npm run preview    # serve the dist/ build locally
npm run clean      # rm -rf dist
```

No test suite exists. Type-checking (`npm run lint`) is the primary correctness gate.

## Environment

Create `.env.local` with:
```
GROQ_API_KEY=your_groq_key
```

`vite.config.ts` injects `GROQ_API_KEY` as `process.env.GROQ_API_KEY` at build time. Firebase credentials live in `firebase-applet-config.json` (already committed — contains project-specific but non-secret config).

## Architecture

### State & Data Flow

`src/AppContext.tsx` is the single global store. It exposes all shared state via `useApp()` and owns every Firebase read/write. Components never import Firebase directly.

- On auth state change, a Firestore `onSnapshot` listener on `users/{uid}/transactions` (ordered by date desc) keeps `transactions` in sync in real-time.
- **Budgets and Goals are in the type system and context shape but have no Firestore sync yet** — `budgets` and `goals` from `useApp()` are always empty arrays (the sync is a `// ...` placeholder at `AppContext.tsx:127`).

### Routing / Navigation

There is no router library. `App.tsx` holds a `useState<'dashboard' | 'transactions' | 'goals' | 'spaces' | 'settings'>` and renders components conditionally via `AnimatePresence`. All transitions use `motion/react`.

### Firebase

- **Auth**: Google OAuth via `loginWithGoogle()` in `src/lib/firebase.ts`. Tries `signInWithPopup` first; falls back to `signInWithRedirect` on `auth/popup-blocked`. `handleRedirectResult()` is called once on app start to complete redirect flows.
- **Firestore path**: `users/{uid}/transactions/{id}`. Each document carries an `isEncrypted: boolean` flag.

### Encryption

`src/lib/encryption.ts` — AES-GCM via the Web Crypto `SubtleCrypto` API. The encryption key is derived from the first 32 bytes of `userId`. Only `transaction.note` is encrypted; everything else is stored in plaintext. Encryption happens in `AppContext.addTransaction`; decryption happens inside the `onSnapshot` callback.

### AI / Groq

`src/services/aiService.ts` — three functions, all calling `meta-llama/llama-4-scout-17b-16e-instruct` via `groq-sdk`:
- `extractTransactionFromImage(base64)` — single receipt OCR
- `extractTransactionsFromMultipleImages(base64[])` — batch receipt OCR
- `parseSmartImport(text)` — parse raw text or CSV into transactions

All three return `ExtractedTransaction[]` with a `confidence` score. The Groq client is instantiated with `dangerouslyAllowBrowser: true` (API key is exposed to the browser bundle).

### UI Conventions

- **Styling**: Tailwind CSS v4 (vite-plugin, no `postcss.config`). Dark theme — `#050505` background, `emerald-500` primary accent.
- **Reusable CSS classes**: `glass-card`, `glass-button`, `glass-panel` — defined in the global stylesheet, not in component files.
- **Icons**: exclusively `lucide-react`.
- **Animation**: `motion/react` (`motion.div`, `AnimatePresence`).
- **Utility**: `cn()` helper in `App.tsx` combines `clsx` + `tailwind-merge`. If you need it in a component, re-implement locally or import from a shared util — it is not currently exported.

### Key Types (`src/types.ts`)

```ts
Transaction  // has optional receiptUrl (unused), isShared, spaceId
Budget       // categoryId, amount, month (YYYY-MM)
Goal         // id, name, targetAmount, currentAmount, deadline
SharedSpace  // id, name, members: string[] (UIDs)
```

## Remaining gaps

| Feature | Location | Status |
|---|---|---|
| Budget management | `types.ts`, `AppContext.tsx` | Type defined, no UI, no Firestore sync |
| Receipt image storage | `Transaction.receiptUrl` | Field defined in types; requires Firebase Storage setup |
| Appearance themes | `Settings.tsx` | Glass Dark is the only theme; Light is stubbed as "Soon" |
| Biometric Lock | `Settings.tsx` | Modal explains it's coming; WebAuthn not yet wired |
| Shared space transactions | `AddTransactionModal.tsx` | `isShared`/`spaceId` fields exist but modal doesn't set them; space ledger queries `spaces/{id}/transactions` which stays empty until populated |
