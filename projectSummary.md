 # CycleBees WhatsApp Service — Project Summary

 A concise, end-to-end overview of the current project: what it does, how it’s structured, the admin and customer flows, data model, APIs, and key implementation details. This reflects the simplified “estimate-only” architecture (no online payments) currently implemented in the codebase.

 ## 1) Purpose & Scope
 - Provide professional, itemized service estimates for bike servicing.
 - Send estimate links to customers via WhatsApp; customers can review, select add-ons, and confirm.
 - Generate branded, downloadable estimate/confirmed-order documents (HTML/PDF via client-side generation).
 - Track request status (draft → viewed → confirmed → cancelled). No payment processing.

 ## 2) Tech Stack
 - Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4.
 - APIs: Next.js Route Handlers under `app/api/*`.
 - DB: Supabase (PostgreSQL) via `@supabase/supabase-js`.
 - Validation: Zod schemas.
 - Utilities: `html2pdf.js` for client-side PDF; custom currency/phone helpers.

 ## 3) Configuration & Environment
 - Required env vars (read by client/server):
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
   - `NEXT_PUBLIC_BASE_URL`: Public base URL for building shareable order links
 - Build/dev scripts in `package.json` (`next dev/build/start` with Turbopack enabled).

 ## 4) Repository Structure (high-level)
 - `app/`
   - `page.tsx`: Landing (links to `/lookup` and `/admin`).
   - `layout.tsx`: Root layout/styles.
   - `lookup/`: Public order lookup by Order ID + phone.
   - `o/[slug]/`: Public customer flow pages
     - `services/page.tsx`: Step 1 — choose services/parts
     - `addons/page.tsx`: Step 2 — optional add-on services
     - `page.tsx`: Step 3 — review + confirm, download confirmed order
   - `admin/`: Admin dashboard
     - `layout.tsx`: Client-side session check + nav
     - `page.tsx`: Requests list, actions (view, copy link, WhatsApp, cancel, download confirmed PDF)
     - `login/page.tsx`: Simple form posts to `/api/admin/auth`
     - `new/page.tsx`: Create new service request (customer + items)
   - `api/`: Serverless route handlers (see section 6)
 - `lib/`
   - `supabase.ts`: Client setup + TypeScript interfaces
   - `utils.ts`: Helpers (currency, phone, WhatsApp URL/message, order ID, UPI link)
   - `bill-generator.ts`: HTML generation + client-side PDF/HTML download
   - `validations.ts`: Zod schemas for inputs
 - `database/schema.sql`: Full schema, triggers, seed data.
 - `components/ui/*`: Button, Input, Label, Badge primitives.
 - `types/html2pdf.d.ts`: TS types for `html2pdf.js`.

 ## 5) Data Model (Supabase/Postgres)
 Tables (key columns only):
 - `requests`
   - `id` (UUID, PK), `short_slug` (unique 8-char public identifier)
   - `order_id`, `bike_name`, `customer_name`, `phone_digits_intl`
   - `status` in ['draft','viewed','confirmed','cancelled']
   - `subtotal_paise`, `tax_paise` (always 0 currently), `total_paise`
   - `created_at`, `sent_at`
 - `request_items`
   - `id` (UUID, PK), `request_id` (FK → requests)
   - `section` in ['repair','replacement']
   - `label`, `price_paise`, `is_suggested`
   - Trigger auto-updates `requests` totals when items change
 - `addons`
   - `id`, `name`, `description`, `price_paise`, `is_active`, `display_order`
   - Seeded default add-ons provided
 - `admin_credentials`
   - `username`, `password`, `is_active` (simple credential table for demo)
 - `confirmed_order_services`
   - Mapping of `request_id` → selected `request_items.id`
 - `confirmed_order_addons`
   - Mapping of `request_id` → selected `addons.id`

 Database features:
 - Function + trigger to auto-generate `short_slug` on `requests` insert.
 - Triggers to recalc and persist `subtotal_paise` and `total_paise` whenever `request_items` change.
 - Indexes on `requests.short_slug`, `status`, `created_at`; `request_items.request_id`; `addons.is_active, display_order`.

 Note: All amounts are stored/handled in paise and displayed as INR (rupees) via helpers.

 ## 6) API Routes (Next.js Route Handlers)
 Admin + Internal:
 - `GET /api/requests` — List requests, optional `?status=` filter; includes items count.
 - `POST /api/requests` — Create request + items. Validated with `createRequestSchema`.
 - `GET /api/requests/[id]` — Fetch single request with items.
 - `PATCH /api/requests/[id]` — Update selective fields (currently `status`; sets `sent_at` when `sent`).
 - `DELETE /api/requests/[id]` — Delete request (forbidden if `status='viewed'`).
 - `GET /api/requests/[id]/confirmed` — Return IDs of confirmed services/addons for rendering UIs.
 - `GET /api/requests/[id]/pdf` — Returns HTML for confirmed order; client downloads and can convert to PDF.
 - `POST /api/admin/auth` — Simple credential check against `admin_credentials` (demo-only).
 - `GET /api/admin/addons` — List all add-ons (ordered).
 - `POST /api/admin/addons` — Create add-on; auto-increments `display_order`.
 - `PATCH /api/admin/addons/[id]` — Update add-on fields (incl. toggle `is_active`).
 - `DELETE /api/admin/addons/[id]` — Delete add-on.

 Public (Customer):
 - `GET /api/public/lookup?orderId=&phone=` — Find order by `order_id` and `phone_digits_intl`; returns `shortSlug`.
 - `GET /api/public/orders/[slug]` — Get a request by public slug with items.
 - `POST /api/public/orders/[slug]/view` — Mark as `viewed` or `confirmed`; persists final totals and selected services/addons when confirmed.

 ## 7) Admin Workflow (Mechanic/Staff)
 1) Login
 - Visit `/admin/login`. POSTs credentials to `/api/admin/auth`.
 - On success, sets `sessionStorage['adminAuth']='authenticated'` and redirects to `/admin`.

 2) Create Request
 - Navigate to `/admin/new`.
 - Enter customer details, WhatsApp phone (digits only, international format without `+`), bike, and initial services/parts.
 - Client-side validation via Zod. Prices input in rupees are converted to paise.
 - Submits to `POST /api/requests`. On success, receive `id` + `short_slug`.

 3) Send on WhatsApp
 - Use generated short link `${NEXT_PUBLIC_BASE_URL}/o/${short_slug}`.
 - Message built by `generateWhatsAppMessage(...)` → opened via `wa.me` URL.
 - Admin “status” is not forced to `sent`; status updates to `viewed` automatically when the customer opens link (see customer flow below).

 4) Manage Requests
 - `/admin` lists requests with filters: all, draft, viewed, confirmed, cancelled.
 - Actions per request:
   - View public page
   - Copy order link
   - Send/Resend via WhatsApp
   - Cancel (sets `status='cancelled'`)
   - If confirmed: Download confirmed order PDF/HTML (client-side generation).

 5) Add-on Management
 - `/admin/addons` to create, edit, toggle active, and delete add-ons. Public pages show only active add-ons.

 ## 8) Customer Workflow (Public)
 Entry points:
 - WhatsApp link sent by admin: `${BASE_URL}/o/[slug]`
 - Or self-lookup at `/lookup` → `GET /api/public/lookup` → redirect to `/o/[slug]`.

 Step 1 — Services (`/o/[slug]/services`)
 - Fetch `GET /api/public/orders/[slug]`.
 - Pre-select items where `is_suggested=true` unless order already confirmed.
 - If `status='draft'`, immediately POST `/api/public/orders/[slug]/view` with pre-selected items and `status='viewed'` (records that customer engaged with the estimate and updates totals accordingly). Selected items stored in `sessionStorage`.

 Step 2 — Add-ons (`/o/[slug]/addons`)
 - `GET /api/addons` for active add-ons; allow selection. Persist selection in `sessionStorage`.

 Step 3 — Review & Confirm (`/o/[slug]`)
 - Load persisted selections from `sessionStorage`.
 - Compute totals: subtotal (selected services) + add-ons + fixed La Carte charge ₹99 (9900 paise).
 - On Confirm: POST `/api/public/orders/[slug]/view` with `status='confirmed'`, selected items, and selected add-ons. This stores selections to `confirmed_order_services` and `confirmed_order_addons` and writes final totals into `requests`.
 - After confirming, customer can download the confirmed order (HTML/PDF via client-side `bill-generator.ts`).

 Notes:
 - “Need Help?” buttons open WhatsApp prefilled messages for support.
 - If `status='cancelled'`, public pages show a cancelled message and contact option.

 ## 9) Pricing & Totals
 - All prices are GST-inclusive and stored in paise.
 - Fixed “La Carte Services” charge = ₹99 (9900 paise), always added to totals at customer-facing steps and in generated documents.
 - Database triggers keep `requests.subtotal_paise` and `total_paise` in sync when items change; customer selections at confirm time also update the request totals via the `view` API.

 ## 10) Document Generation (HTML/PDF)
 - `lib/bill-generator.ts` produces branded HTML for:
   - Service Estimate (default view)
   - Confirmed Service Order (when `status='confirmed'`)
 - Client-side export:
   - Primary: `createBillDownload(html, filename)` loads `html2pdf.js` dynamically and saves PDF.
   - Fallback: downloads raw HTML file if PDF generation fails.
 - Admin can download confirmed order via dashboard; customers can download after confirming.

 ## 11) Utilities & Validation
 - `lib/utils.ts`:
   - `formatCurrency`, `rupeesToPaise`, `paiseToRupees`
   - `isValidPhoneNumber`, `formatPhoneNumber`
   - `generateWhatsAppURL`, `generateWhatsAppMessage`, `generateOrderID`
   - `generateUPIPaymentURL` (utility present; no payment is performed in the current flow)
 - `lib/validations.ts` (Zod):
   - `requestSchema`, `requestItemSchema`, `createRequestSchema`
   - `customerOrderSchema` for public view/confirm POST

 ## 12) Status Lifecycle & Rules
 - `draft`: Created by admin; becomes `viewed` when customer opens the link (Step 1 or Step 3 triggers `view` POST with suggested selections).
 - `viewed`: Customer engaged; admin can resend link or cancel.
 - `confirmed`: Customer confirmed; selections are persisted; PDFs available.
 - `cancelled`: Admin-cancelled; public pages show cancelled message.
 - Deletion: Disallowed if already `viewed` (via DELETE handler guard).

 ## 13) Security & Auth Notes
 - Admin auth: Demo-only — checks username/password in `admin_credentials` via `/api/admin/auth`, then stores a flag in `sessionStorage`. No JWTs or server-side sessions.
 - Middleware: `middleware.ts` checks `adminAuth` cookie for `/admin`, but UI uses `sessionStorage`. Cookie/session mismatch means middleware won’t actually protect server routes; client-side layout handles gating. For production, unify on secure, server-validated auth (e.g., HttpOnly cookie + middleware checks).
 - Input validation: Zod schemas on API boundaries.
 - Supabase client: Uses anon key; ensure Row Level Security is configured appropriately if enabling public access. Current code assumes trusted server-side calls.

 ## 14) Known Limitations / Next Improvements
 - Auth hardening: Replace demo credentials with proper auth, store server-validated sessions (cookies) and align `middleware.ts`.
 - Admin “sent” state: Optionally set `status='sent'` when WhatsApp link is generated; currently status jumps from `draft` to `viewed` upon first customer visit.
 - Server-side PDF: Consider server-side PDF generation for pixel-perfect docs and consistent filenames.
 - Phone formatting/validation: Currently expects digits-only international format without `+`; consider normalization helpers in forms.
 - Data access: Evaluate RLS and service role keys for secure server-side operations.
 - UX polish: Toasts for copy/sent actions, better error states, and analytics.

 ## 15) How It All Fits Together (High-level Flow)
 - Admin creates request → short slug + items are stored.
 - Admin shares WhatsApp link → customer opens and sees preselected recommended items.
 - System marks as `viewed` when first visited; selections can be adjusted in steps.
 - Customer optionally picks add-ons, then confirms → selections stored; totals written; status `confirmed`.
 - Either party can download a professional document. Admin dashboard reflects real-time status and totals.

 — End of summary —
