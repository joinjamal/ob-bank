# OB Bank

OB Bank is a full-stack digital allowance bank for Basil and Osama. It uses Neon Serverless Postgres with Prisma and is deployed on Vercel.

## Stack

- Next.js App Router with React and TypeScript
- Tailwind CSS for responsive UI
- Prisma ORM with Neon Serverless Postgres
- Recharts for analytics
- Papa Parse CSV import endpoint
- In-browser Web Audio sounds for deposits and withdrawals
- Password-protected parent admin route at `/admin`

## Database (Neon Postgres)

OB Bank is connected to Neon Serverless Postgres:

- Provider: Neon Serverless Postgres
- Host: `ep-wild-snow-axjyshpq.c-4.us-east-2.aws.neon.tech`

For Vercel/serverless deployments with Prisma, set these environment variables in Vercel:

```bash
DATABASE_URL="postgresql://neondb_owner:[PASSWORD]@ep-wild-snow-axjyshpq-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:[PASSWORD]@ep-wild-snow-axjyshpq.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
ADMIN_PASSWORD="choose-a-strong-parent-password"
ADMIN_SESSION_SECRET="choose-a-long-random-session-secret"
```

## Vercel Deployment

1. Push this repo to GitHub.
2. Ensure `DATABASE_URL` and `DIRECT_URL` environment variables are configured in Vercel Project Settings.
3. Deploy.

`postinstall` runs `prisma generate`, so Vercel has the Prisma client during build.

## Avatar Uploads

Kid avatars are clickable on `/`. Uploaded images are resized in the browser and saved as base64 data URLs in `accounts.avatar_url`.

## Parent Admin

Visit `/admin` and sign in with `ADMIN_PASSWORD`. Parent tools live there:

- Add deposits or withdrawals
- Import legacy CSV rows
- Edit transaction type, amount, and reason
- Delete transactions

Edits and deletes recalculate the affected kid's balance automatically.

## Local Development

```bash
npm install
npm run dev
```

## Android App

This repo includes a Capacitor Android app that opens the live OB Bank site at:

```text
https://ob-bank.vercel.app
```

Use this workflow after deploying the web app:

```bash
npm run android:sync
npm run android:open
```

Android Studio will open the native project in `android/`. From there, choose a device or emulator and press Run.
