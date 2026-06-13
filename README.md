# OB Bank

OB Bank is a full-stack digital allowance bank for Basil and Osama. It uses a hosted Supabase Postgres database through Prisma and is ready to deploy on Vercel.

## Stack

- Next.js App Router with React and TypeScript
- Tailwind CSS for responsive UI
- Prisma ORM with Supabase Postgres
- Recharts for analytics
- Papa Parse CSV import endpoint
- In-browser Web Audio sounds for deposits and withdrawals
- Password-protected parent admin route at `/admin`

## Supabase

The Supabase project is already created:

- Project name: OB Bank
- Project ref: `qpjblmdlglqewxqwhfpi`
- Project URL: `https://qpjblmdlglqewxqwhfpi.supabase.co`
- Region: `ap-northeast-1`

The database schema and starter seed data have been applied to Supabase.

For Vercel/serverless deployments with Prisma, set these environment variables:

```bash
DATABASE_URL="postgres://postgres.qpjblmdlglqewxqwhfpi:[YOUR-DATABASE-PASSWORD]@[YOUR-POOLER-HOST]:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgres://postgres.qpjblmdlglqewxqwhfpi:[YOUR-DATABASE-PASSWORD]@[YOUR-POOLER-HOST]:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://qpjblmdlglqewxqwhfpi.supabase.co"
ADMIN_PASSWORD="choose-a-strong-parent-password"
ADMIN_SESSION_SECRET="choose-a-long-random-session-secret"
```

Use the Supabase dashboard Connect panel to copy the exact pooler host and insert the database password.

## Vercel Deployment

1. Push this repo to GitHub.
2. Import the repo in Vercel as a Next.js project.
3. Add the environment variables from `.env.example` in Vercel Project Settings.
4. Deploy.

`postinstall` runs `prisma generate`, so Vercel has the Prisma client during build.

## Avatar Uploads

Kid avatars are clickable on `/`. Uploaded images are resized in the browser and saved as base64 data URLs in `accounts.avatar_url`. This keeps the two-kid app simple and avoids Supabase Storage policies. If you later prefer Supabase Storage, create a public bucket named `avatars`, upload images there, and store the public URL in the same `avatar_url` field.

## Parent Admin

Visit `/admin` and sign in with `ADMIN_PASSWORD`. Parent tools live there:

- Add deposits or withdrawals
- Import legacy CSV rows
- Edit transaction type, amount, and reason
- Delete transactions

Edits and deletes recalculate the affected kid's balance automatically.

If you add new migrations later, run:

```bash
npm run prisma:deploy
```

## Local Development

```bash
npm install
npm run dev
```

## API Routes

- `GET /api/accounts`: current account cards for Basil and Osama
- `GET /api/transactions`: latest 30 transactions with account details
- `POST /api/transactions`: creates a deposit or withdrawal and snapshots today's ledger
- `GET /api/ledger`: historical balance rows for the trend chart
- `POST /api/import`: imports legacy CSV transaction rows

Example transaction body:

```json
{
  "accountId": "uuid",
  "type": "Deposit",
  "amount": 25,
  "reason": "Weekly allowance"
}
```

CSV import headers:

```csv
kid,date,type,amount,reason
Basil,2026-06-12,Deposit,25,Weekly allowance
Osama,2026-06-12,Withdrawal,8.50,Book fair
```

`reason` is optional for both manual entries and CSV imports.
