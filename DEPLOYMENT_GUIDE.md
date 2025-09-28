# CycleBees WhatsApp Service — Vercel Deployment Guide

This guide walks you through deploying the app to Vercel using the Vercel CLI, with Supabase as the database.

## Prerequisites
- Node.js 18+ and npm
- Vercel account + `vercel` CLI (`npm i -g vercel`)
- Supabase project (URL + keys)

## 1) Supabase Setup
1. Create a new Supabase project.
2. In Supabase > SQL Editor, run the SQL in `database/schema.sql` (this creates tables, triggers, indexes, and seed add-ons).
3. Note your credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key

Optional later (hardening): Add RLS policies and plan a server-only service key for admin endpoints.

## 2) Environment Variables
Required in all environments (Development/Preview/Production):
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `NEXT_PUBLIC_BASE_URL` — Public base URL for links (e.g., `https://your-domain.vercel.app`)

Using Vercel CLI to set vars:
```
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_BASE_URL
```

Local development (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 3) Local Sanity Check
```
npm install
npm run dev
```
Verify:
- `/lookup` (public lookup)
- Full customer flow: `/o/[slug]/services` → Add-ons → Confirm → PDF
- Admin: `/admin`, `/admin/login`, `/admin/addons` → Confirmed PDF

## 4) Link and Configure Vercel
```
vercel login
vercel
```
- Choose project name and scope when prompted.
- Framework auto-detected as Next.js.
- Add env vars if prompted, or run the commands from step 2.

Pull envs locally (optional):
```
vercel env pull .env.local
```

## 5) Deploy
- Preview: `vercel --prod false`
- Production: `vercel --prod`

Build scripts (already configured):
- `dev`: `next dev --turbopack`
- `build`: `next build --turbopack`
- `start`: `next start`

## 6) Post‑Deploy Checklist
- Open deployed URL and test customer + admin flows
- WhatsApp links use the correct `NEXT_PUBLIC_BASE_URL`
- Confirmed PDFs show exact selected services/add-ons

## 7) Production Hardening (Recommended Soon)
- Auth security:
  - Replace demo admin auth with hashed passwords + secure sessions (HttpOnly cookie/JWT)
  - Enforce route protection in middleware and server handlers
- Supabase security:
  - Add RLS policies or run admin routes with a server-only service key
  - Never expose a service key to the client
- Confirm API edge case:
  - Allow confirmation with no selected service items (La Carte only) and compute totals accordingly
- Data auditability:
  - Add `confirmed_at` to `requests`
  - Snapshot confirmed selections (label + price) in JSONB or snapshot tables
- Ops hygiene:
  - Basic rate limiting on public endpoints
  - Error monitoring (e.g., Sentry) and structured logs

## 8) Troubleshooting
- Invalid UTF‑8 during build:
  - Ensure source files are UTF‑8 encoded (we sanitized `app/o/[slug]/services/page.tsx`)
- 404 or PGRST errors:
  - Double-check Supabase URL/key, table availability, and permissions/RLS
- Wrong links in WhatsApp:
  - Confirm `NEXT_PUBLIC_BASE_URL` matches your deployment domain (Preview vs Production)

## 9) Useful Commands
```
vercel                      # Initialize / deploy (interactive)
vercel --prod               # Promote to Production
vercel env add NAME         # Add env var
vercel env pull .env.local  # Pull envs locally
```

---

This project uses Next.js Route Handlers under `app/api/*` and Supabase for persistence. Client-side PDF generation is used for both customer and admin PDFs. For high-reliability bulk admin workflows, consider server-side PDF rendering post-launch.

