# Build Plan: WhatsApp-Based Service Request App (Simple + Detailed)

Use this as a step-by-step recipe to create a similar app from scratch, and to understand how all pieces fit together. Each phase has: goal → what to create → how to test.

## 0) Prerequisites (5–15 min)

- Install Node.js LTS (18+), npm.
- Create a Supabase project (Postgres) and note: `project URL`, `anon key`.
- Prepare an n8n instance with WhatsApp Business Cloud API.
- Decide your domain for `NEXT_PUBLIC_BASE_URL` (local: http://localhost:3000).

Quick sanity test: `npx create-next-app@latest` runs, `npm run dev` opens a page.

## 1) Repository Scaffold (15–30 min)

Goal: A clean Next.js + TS + Tailwind app with basic scripts.

- Initialize Next.js (App Router, TS):
  - Scripts: `dev`, `build`, `start`, `lint` in `package.json`.
- Add Tailwind v4 + PostCSS and simple global styles in `app/globals.css`.
- Add dependencies: `@supabase/supabase-js`, `react-hook-form`, `zod`, `lucide-react`, `html2pdf.js`, `clsx`, `tailwind-merge`.
- Configure TypeScript paths (`@/*`) in `tsconfig.json`.

Test: `npm run dev` opens http://localhost:3000.

## 2) Database Schema & Migrations (30–45 min)

Goal: Tables for requests, items, addons, bundles, and confirmed selections.

- Create `database/schema.sql` with:
  - `requests`, `request_items`, `addons`, `service_bundles`, `admin_credentials`.
  - `confirmed_order_services`, `confirmed_order_addons`, `confirmed_order_bundles`.
  - Triggers: generate `short_slug`, update totals after item changes.
- Create migration `database/migrations/001_add_pending_status.sql` with:
  - Add `pending` status; add WhatsApp tracking columns; helper indexes.

Apply in Supabase SQL editor. Test by inserting a sample request + items.

## 3) Environment & Config (10–15 min)

Goal: Wire secrets and app settings.

- Add `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL=...`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
  - `N8N_WEBHOOK_URL=...`
  - `NEXT_PUBLIC_BASE_URL=http://localhost:3000`
- Confirm `next.config.ts` and `tsconfig.json` are valid.

Test: Start server; env variables available (e.g., log them temporarily in a route).

## 4) Core Libraries (45–60 min)

Goal: Reuse helpers everywhere, keep pages thin.

- `lib/supabase.ts`: create client using env vars and export TS interfaces (Request, RequestItem, Addon, ServiceBundle…).
- `lib/utils.ts`:
  - Currency helpers (paise↔rupees, `formatCurrency`)
  - Phone normalization (`normalizeIntlPhone`) + WhatsApp URL helpers
  - WhatsApp message template (`generateWhatsAppMessage`)
  - Date formatting + status -> CSS color mapping
  - `generateOrderID` utility
- `lib/validations.ts`:
  - Zod schemas: `requestSchema`, `requestItemSchema`, `createRequestSchema`, `customerOrderSchema`.
- `lib/lacarte.ts`:
  - Get settings price (server vs client), 1‑minute cache, defaults, helpers to format/show discount.
- `types/html2pdf.d.ts`: TS shim for dynamic import.
- `lib/bill-generator.ts`:
  - `generateBillHTML(data)`, `createBillDownload(html, filename)`, HTML fallback.
- `lib/notification.ts`:
  - NotificationManager (sound + favicon/title), StatusChangeDetector (map of last statuses).

Test: Import each helper in a scratch route to verify types and basic behavior.

## 5) API Routes (2–4 hours; build in this order)

Keep routes small and predictable; return clear JSON and errors.

- Public lookups
  - `GET /api/public/lookup` → query by `orderId`, `phone` → returns `{ shortSlug, orderId, customerName, bikeName, status }`.
  - `GET /api/public/orders/[slug]` → request + items.
  - `POST /api/public/orders/[slug]/view` → body `{ selected_items, selected_addons?, selected_bundles?, status? }` → set status to `viewed` or `confirmed`; save selections and totals.

- Catalog
  - `GET /api/addons` → active add-ons
  - `GET /api/bundles` → active bundles
  - Admin: `GET/POST /api/admin/addons`, `PATCH/DELETE /api/admin/addons/[id]`
  - Admin: `GET/POST /api/admin/bundles`, `PATCH/DELETE /api/admin/bundles/[id]`
  - Admin La Carte: `GET/PUT /api/admin/lacarte`

- Requests
  - `GET /api/requests` → filters (status/date/search), pagination, items included.
  - `POST /api/requests` → validate, insert request + items, return `{ id, short_slug }`.
  - `GET/PATCH/DELETE /api/requests/[id]` → guard PATCH so only allowed fields (status) can change.
  - `GET/POST /api/requests/[id]/items` and `PUT/DELETE /api/requests/[id]/items/[itemId]` → lock edits once not `sent`.
  - `GET/POST /api/requests/[id]/notes` and `PUT/DELETE /api/requests/[id]/notes/[noteId]`.
  - `GET /api/requests/[id]/confirmed` → fetch selected IDs.
  - `GET /api/requests/[id]/pdf` → returns HTML (client generates PDF).

- Analytics
  - `GET /api/analytics` → totals, orders by status, top services, revenue by period, daily trends.

- WhatsApp (n8n)
  - `POST /api/webhooks/send-whatsapp` → build message, call `N8N_WEBHOOK_URL` with 30s timeout, parse success/error shapes.
  - `PATCH /api/requests/[id]/update-whatsapp-status` → persist `{ success, whatsappMessageId?, whatsappError? }`.

Test: Use curl or Thunder Client to hit each route with sample bodies and check DB changes.

## 6) Admin UI (2–4 hours)

Goal: A productive dashboard to create and track requests.

- Auth
  - `middleware.ts` → redirect `/admin` to `/admin/login` if no cookie
  - `app/admin/login/page.tsx` → POST `/api/admin/auth`; on success set cookie + sessionStorage
  - `app/admin/layout.tsx` → header/nav; client checks sessionStorage; logout clears both

- Dashboard `app/admin/page.tsx`
  - Table with columns: Order ID, Customer, Bike, Items, Amount, Status, Created, Actions
  - Filters: all/pending/sent/viewed/confirmed/cancelled; search across common fields
  - Actions: resend WA (deep link), cancel, delete, preview, CSV download
  - Polling: 10s; when status changes → sound + favicon/title indicator

- New Request `app/admin/new/page.tsx`
  - RHF + Zod, inline errors, auto order ID, phone validation helper
  - “Save & Send” → POST `/api/requests` → POST `/api/webhooks/send-whatsapp`
  - Retry when updating WA status, with helpful alerts

- Settings `app/admin/settings/page.tsx`
  - Add-ons CRUD; Bundles CRUD; La Carte settings (price + optional discount note)

- Analytics `app/admin/analytics/page.tsx`
  - Date range → call `/api/analytics`; show totals, charts/tables

Test: Walk through create → send → list → filter → CSV → preview → settings.

## 7) Public UI (1–3 hours)

Goal: Customer can view, select, and confirm easily on mobile.

- Lookup `app/lookup/page.tsx` → takes Order ID + phone; calls `/api/public/lookup`; redirects to slug
- Order page `app/o/[slug]/page.tsx`:
  - Load order + items; pre-select suggested items; mark `viewed` on first load if pending/sent
  - Allow selecting items/add-ons/bundles; compute totals + fixed La Carte charge
  - Confirm → `POST .../view` with status=confirmed; show success, allow confirmed PDF download
- Reusable mobile UI in `components/mobile/*`

Test: Use a test request link and complete the flow on a phone.

## 8) WhatsApp + n8n (30–60 min)

Goal: Robust send with clear feedback.

- n8n workflow: Webhook (POST) → WhatsApp Business Cloud (Continue On Fail=ON) → Respond to Webhook
- Test payload:
  - `{ "phone": "+919999999999", "message": "Test", "customerName": "Test", "bikeName": "Bike", "orderId": "TEST001", "orderUrl": "http://test" }`
- Ensure response includes either a `messages[0].id` or a clear error object/string.
- App route handles: timeout (30s), network errors, different response shapes, friendly error messages.

Test: Valid and invalid numbers; confirm DB status updates accordingly.

## 9) PDF, CSV, Notifications (45–60 min)

- PDF: admin + public confirmed use the same `generateBillHTML` data shape; client `createBillDownload`; fallback to HTML.
- CSV: compose rows with Excel-safe BOM and quoting; provide date-range export (limit 1000).
- Notifications: polling + `NotificationManager`; clear indicators on focus.

Test: Download sample PDF/HTML, open CSV in Excel (UTF‑8), see notification behavior.

## 10) Security Hardening (60–120 min)

- Replace simple admin auth:
  - Hash passwords (bcrypt/argon2)
  - Signed, httpOnly cookies + server session checks in admin APIs
  - CSRF token on mutating endpoints
  - Rate-limit login and webhook calls
- Consider RLS for sensitive tables; keep anon reads limited; use service role server-side when needed.

Test: Try protected routes without cookie; verify denied. Verify CSRF and rate limit.

## 11) Testing Strategy (ongoing)

- Unit: utils and Zod schemas
- Integration: API routes (happy path + error states)
- E2E: create → send → view → confirm round trip
- Manual: use Testing Guide (valid/invalid number, timeout, filters)

## 12) Observability

- Log webhook responses (success/error) with context (orderId, phone truncated)
- Query success/pending rates via SQL (24h window)
- Track trends via `/api/analytics`; add simple dashboard tiles

## 13) Deployment & Rollback

- Deploy to Vercel; configure env vars; run migration first
- Post-deploy: send a real and a fake number; verify DB statuses
- Rollback: run `001_rollback_pending_status.sql`, revert code, restore env

## 14) Daily Checklist (TL;DR)

- npm install; env set
- Run migrations
- Implement libs → APIs → UIs (public → admin)
- Wire n8n; validate WA send
- Add PDF/CSV; add polling notifications
- Harden auth; add minimal tests; deploy; smoke test

That’s it. Use this plan to reconstruct the app step-by-step, or as a map to understand how the existing code works and why it’s structured this way.

