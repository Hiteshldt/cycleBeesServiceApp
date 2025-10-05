# Build Plan: WhatsApp-Based Service Request App

This guide is a blueprint for building a project similar to this repo from zero to production. It focuses on phases, file-by-file scaffolding, data flow, and quality gates so you can both replicate and understand how everything fits together.

## Vision & Scope

- Goal: Admins create bike service requests; system sends a WhatsApp link via n8n; customers view an estimate, select services/add-ons/bundles, and confirm; admins track statuses, export, and download PDFs.
- Constraints: Client-side Supabase (Anon key), Next.js App Router, Tailwind, Zod, React Hook Form, n8n + WhatsApp Cloud API.

## Architecture Overview

- Web (Next.js 15 App Router): admin and public UIs + API routes
- Database (Supabase/Postgres): requests, items, addons, bundles, confirmed selections
- Automation: n8n workflow for WhatsApp send; server route proxies to n8n
- PDF: client-side html2pdf with HTML fallback
- Notifications: client polling + sound/favicon/title changes

## Milestones

1) Project Setup & Tooling
2) Database Schema & Migrations
3) Core Libraries (supabase client, utils, validation, La Carte)
4) API Endpoints (requests CRUD, public routes, admin catalog, analytics)
5) Admin UI (dashboard, new request, settings, analytics)
6) Public UI (order view, selection, confirmation)
7) WhatsApp Integration (n8n webhook, timeouts, retries)
8) PDF/Export/Notifications
9) Security Hardening & Observability
10) Production Deployment & Rollback

## Project Setup

- Create Next.js 15 + TS app
  - Scripts: `dev`, `build`, `start`, `lint`
- Add Tailwind v4 + PostCSS
- Add dependencies: `@supabase/supabase-js`, `react-hook-form`, `zod`, `lucide-react`, `html2pdf.js`, `tailwind-merge`, `clsx`
- Configure TypeScript paths (`@/*`) and ESLint
- Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BASE_URL`, `N8N_WEBHOOK_URL`

## Folder Structure

- `app/` pages and server routes (App Router)
- `lib/` core logic: `supabase.ts`, `utils.ts`, `validations.ts`, `lacarte.ts`, `bill-generator.ts`, `notification.ts`
- `components/` UI primitives + mobile components + bill preview
- `database/` `schema.sql` + `migrations/`
- `types/` TS shims (`html2pdf.d.ts`)

## Database Design (Supabase)

- `requests(id, short_slug, order_id, bike_name, customer_name, phone_digits_intl, status, subtotal_paise, tax_paise, total_paise, created_at, sent_at, whatsapp_message_id, whatsapp_sent_at, whatsapp_error)`
- `request_items(id, request_id -> requests, section{repair|replacement}, label, price_paise, is_suggested, created_at)`
- `addons(id, name, description, price_paise, is_active, display_order, created_at)`
- `service_bundles(id, name, description, price_paise, bullet_points[], is_active, display_order, created_at, updated_at)`
- `confirmed_order_services(id, request_id, service_item_id, selected_at)`
- `confirmed_order_addons(id, request_id, addon_id, selected_at)`
- `confirmed_order_bundles(id, request_id, bundle_id, selected_at)`
- `admin_credentials(id, username, password, is_active, created_at)`
- Triggers: generate `short_slug`, update request totals on `request_items` changes
- Migration: add `pending` status, WhatsApp tracking columns + partial indexes

## Core Libraries To Implement

- `lib/supabase.ts` — create client + exported TS interfaces for all tables
- `lib/utils.ts` — currency helpers (paise/rupees), phone normalization and C2C URL, WhatsApp message template, date formatting, status colors, order ID generator
- `lib/validations.ts` — Zod schemas: request, request item, create request payload, customer selection payload
- `lib/lacarte.ts` — La Carte price/settings fetch (SSR/CSR branches), cache, formatting helpers
- `lib/bill-generator.ts` — generate HTML bill, client `createBillDownload` via html2pdf, and HTML fallback
- `lib/notification.ts` — sound + favicon/title indicator, status change detector for polling

## API Design (App Router)

- Requests collection: `app/api/requests/route.ts`
  - GET: filters (status, date range, search), pagination, include items
  - POST: Zod validate + insert request + items; returns `id` + `short_slug`
- Request detail: `app/api/requests/[id]/route.ts`
  - GET: request + items
  - PATCH: limited updates (status safety); set `sent_at` when status becomes `sent`
  - DELETE: cascade delete
- Request items: `app/api/requests/[id]/items/route.ts` (GET/POST) and `[itemId]/route.ts` (PUT/DELETE) — locked if not `sent`
- Request notes: `app/api/requests/[id]/notes/route.ts` (GET/POST), `.../notes/[noteId]/route.ts` (PUT/DELETE)
- Confirmed selections (read): `app/api/requests/[id]/confirmed/route.ts`
- Admin PDF: `app/api/requests/[id]/pdf/route.ts` — returns HTML for client PDF creation
- Public lookup: `app/api/public/lookup/route.ts` — by `orderId` + `phone`
- Public order by slug: `app/api/public/orders/[slug]/route.ts`
- Public mark viewed/confirm: `app/api/public/orders/[slug]/view/route.ts` — stores selected items/addons/bundles; updates totals/status
- Catalog: `app/api/addons/route.ts`, `app/api/bundles/route.ts`
- Admin catalog: `app/api/admin/addons/route.ts`, `.../addons/[id]/route.ts`, `app/api/admin/bundles/route.ts`, `.../bundles/[id]/route.ts`
- La Carte admin: `app/api/admin/lacarte/route.ts`
- Admin auth: `app/api/admin/auth/route.ts` — validate username/password against `admin_credentials`
- Analytics: `app/api/analytics/route.ts` — aggregates orders, revenue, status distribution, top services, trends
- WhatsApp webhook proxy: `app/api/webhooks/send-whatsapp/route.ts` — constructs message; POST to `N8N_WEBHOOK_URL` with 30s timeout; normalizes success/error

## n8n Workflow Design

- Nodes: Webhook (POST) → WhatsApp Business Cloud (Continue On Fail=ON) → Respond to Webhook
- Input JSON: `{ phone: "+911234567890", message, customerName, bikeName, orderId, orderUrl, requestId?, timestamp }`
- Respond with either `{ messages:[{id, message_status}] }` or structured error; the Next.js route handles both

## Admin UI (App Router)

- `app/admin/layout.tsx` — header/nav, client auth gate; logout clears session/cookie
- `middleware.ts` — redirect `/admin` to `/admin/login` if no `adminAuth` cookie
- `app/admin/login/page.tsx` — posts to `/api/admin/auth`; sets cookie + sessionStorage
- `app/admin/page.tsx` — dashboard list with filters/search/pagination, resend WhatsApp (deep link), cancel/delete, preview bill, CSV download, polling notifications
- `app/admin/new/page.tsx` — RHF + Zod form, confirm modal, POST `/api/requests`, then POST `/api/webhooks/send-whatsapp`; retry to persist status (PATCH `/update-whatsapp-status`)
- `app/admin/settings/page.tsx` — addons/bundles CRUD, La Carte settings
- `app/admin/analytics/page.tsx` — date range + charts fed by `/api/analytics`

## Public UI

- `app/lookup/page.tsx` — find order by `orderId` + `phone` then redirect to `o/[slug]`
- `app/o/[slug]/page.tsx` — load order + items; mark `viewed` if pending/sent; allow selections & confirm; download confirmed bill; load addons/bundles; uses mobile components
- Optional step pages: `app/o/[slug]/services/page.tsx`, `.../addons/page.tsx`, `.../bundles/page.tsx`
- Mobile components: `components/mobile/*` (AppHeader, CategorySection, SelectionCard, StickyActionBar, Toast)

## PDF & Exports

- Bill preview component for admin: `components/BillPreview.tsx`
- HTML→PDF client generation: `lib/bill-generator.ts` (dynamic import `html2pdf.js` + fallback to HTML)
- CSV export: admin dashboard composes rows from `/api/requests?include_details=true&limit=1000`

## Notifications

- Client polling every 10s on dashboard; compare previous statuses with `StatusChangeDetector` from `lib/notification.ts`; play sound + favicon/title badge

## Security & Hardening (Recommended)

- Replace simple admin auth with: hashed passwords, signed cookies/JWT, server-side checks on admin APIs, CSRF tokens, rate limits
- Add RLS as data sensitivity grows; keep anon reads scoped; use service-role for server-only writes
- Input validation with Zod on all mutating routes; sanitize outputs
- Logging/monitoring around webhook calls and error rates

## Testing Strategy

- Unit: utils (currency, phone normalization, message template), Zod schemas
- Integration: API routes (requests CRUD, webhook proxy, public view/confirm)
- E2E (optional): user flows (admin create/send; customer confirm)
- Manual testing guide: valid/invalid numbers, timeouts, dashboard filters

## Observability

- Request logs with structured errors (n8n responses)
- Analytics API doubling as a sanity dashboard
- Add basic SLIs: webhook success rate, pending vs sent, confirm rate

## Deployment

- Vercel for Next.js; Supabase migrations run before deploy
- Set env vars in Vercel: `NEXT_PUBLIC_*` + `N8N_WEBHOOK_URL`
- Post-deploy smoke tests: send to a real number + fake number; verify statuses

## Rollback

- DB: `database/migrations/001_rollback_pending_status.sql`
- Env: preserve previous `N8N_WEBHOOK_URL`
- Code: revert and redeploy

## Step-By-Step Build Order (Files)

1) Tooling/config: `package.json`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `next.config.ts`, `app/globals.css`
2) DB: `database/schema.sql`, then `database/migrations/001_add_pending_status.sql`
3) Core libs: `lib/supabase.ts`, `lib/utils.ts`, `lib/validations.ts`, `lib/lacarte.ts`, `lib/bill-generator.ts`, `types/html2pdf.d.ts`, `lib/notification.ts`
4) Public APIs: `app/api/public/lookup/route.ts`, `app/api/public/orders/[slug]/route.ts`, `app/api/public/orders/[slug]/view/route.ts`
5) Catalog APIs: `app/api/addons/route.ts`, `app/api/bundles/route.ts`, `app/api/admin/lacarte/route.ts`
6) Requests APIs: `app/api/requests/route.ts`, `app/api/requests/[id]/**`
7) Webhook proxy: `app/api/webhooks/send-whatsapp/route.ts`
8) Admin APIs: `app/api/admin/**`, `app/api/analytics/route.ts`
9) Public pages: `app/page.tsx`, `app/lookup/page.tsx`, `app/o/[slug]/**`
10) Admin pages: `middleware.ts`, `app/admin/layout.tsx`, `app/admin/login/page.tsx`, `app/admin/page.tsx`, `app/admin/new/page.tsx`, `app/admin/settings/page.tsx`, `app/admin/analytics/page.tsx`
11) Finishing touches: mobile components, UI polish, CSV/PDF/notifications

## Launch Checklists

- WhatsApp send (real number) succeeds; message ID captured
- Fake number stays `pending` with readable error
- View/Confirm flow updates totals and confirmed selections
- Dashboard filters/search/pagination work; CSV exports open in Excel
- PDF downloads render on admin + public confirmed pages
- n8n Continue On Fail enabled; webhook observable; timeouts handled
- Admin auth hardened for production

---

If you want, I can scaffold any of these files or add a TODO checklist tailored to your current repo.

