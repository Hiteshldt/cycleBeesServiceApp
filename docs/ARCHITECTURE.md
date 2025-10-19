# CycleBees Services - Architecture Documentation

**Version**: 1.0.0 **Last Updated**: 2025-10-19 **Status**: Production Ready
(Phase 1-3 Complete)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Decision Records (ADRs)](#architecture-decision-records-adrs)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Future Considerations](#future-considerations)

---

## System Overview

**CycleBees Services** is a mobile-first web application for managing bike
service requests and customer estimates. The system enables:

1. **Admin Workflow**: Create service estimates, manage pricing, send WhatsApp
   notifications
2. **Customer Workflow**: View estimates, select services, confirm orders
3. **WhatsApp Integration**: Automated estimate delivery via n8n webhook
   automation

**Key Characteristics**:

- **Single-Tenant**: One CycleBees business instance
- **Mobile-First**: Optimized for mobile customer experience
- **Serverless**: Next.js App Router with Edge/Node.js runtimes
- **Real-Time**: WhatsApp notifications for instant customer engagement

---

## Architecture Decision Records (ADRs)

### ADR-001: Next.js 15 with App Router

**Status**: ✅ Adopted **Date**: 2025-10-15 **Context**: Need a modern,
performant framework for building admin dashboard and customer portal

**Decision**: Use Next.js 15 with App Router (not Pages Router)

**Rationale**:

- **Server Components**: Reduced JavaScript bundle size, faster page loads
- **Server Actions**: Simplified data mutations without API routes
- **Streaming**: Improved perceived performance with React Suspense
- **File-Based Routing**: Intuitive folder structure in `app/` directory
- **Built-in API Routes**: Co-located API endpoints with pages
- **Edge Runtime Support**: Fast authentication middleware
- **Turbopack**: Faster development builds (--turbopack flag)

**Alternatives Considered**:

- **Pages Router**: More stable but lacks Server Components
- **Remix**: Excellent DX but smaller ecosystem
- **Pure React SPA**: Requires separate backend, more complex deployment

**Trade-offs**:

- ✅ **Pro**: Modern React features, excellent DX, fast builds
- ❌ **Con**: Steeper learning curve, some features still experimental

**References**:

- `package.json:23` - Next.js 15.5.2
- `app/` directory structure

---

### ADR-002: Supabase for Database

**Status**: ✅ Adopted **Date**: 2025-10-15 **Context**: Need a managed
PostgreSQL database with minimal setup

**Decision**: Use Supabase as the primary database provider

**Rationale**:

- **Managed PostgreSQL**: No database administration overhead
- **Instant Setup**: Create database with one click
- **Auto-Generated REST API**: Supabase client provides type-safe queries
- **Real-Time Subscriptions**: Future feature potential
- **Built-in Auth**: Not used (custom JWT), but available
- **Free Tier**: Sufficient for MVP and small-scale production
- **Automatic Backups**: Point-in-time recovery

**Alternatives Considered**:

- **PlanetScale**: MySQL, excellent scaling, but prefer PostgreSQL features
- **Neon**: PostgreSQL, serverless, but less mature than Supabase
- **Self-Hosted PostgreSQL**: Full control but requires DevOps expertise

**Trade-offs**:

- ✅ **Pro**: Fast setup, managed backups, generous free tier
- ❌ **Con**: Vendor lock-in, limited control over database configuration

**Security Concerns**:

- ⚠️ Row Level Security (RLS) NOT enabled (see ADR-007)
- Currently relies on API-level authentication

**References**:

- `lib/supabase.ts:1` - Supabase client initialization
- `db/schema.sql:1` - Database schema
- `package.json:14` - @supabase/supabase-js

---

### ADR-003: JWT Authentication (Custom Implementation)

**Status**: ✅ Adopted **Date**: 2025-10-15 **Context**: Need simple admin
authentication without user management overhead

**Decision**: Implement custom JWT authentication with bcrypt password hashing

**Rationale**:

- **Simplicity**: Single admin user, no need for complex auth provider
- **Control**: Full control over token payload and expiration
- **Dual Runtime Support**:
  - Node.js runtime: `jsonwebtoken` + `bcrypt`
  - Edge runtime: `jose` library (middleware)
- **Stateless**: No session storage required
- **Standard**: JWT is industry-standard, works with any client

**Implementation**:

- **Node.js Runtime**: `lib/auth.ts` (API routes)
- **Edge Runtime**: `lib/auth-edge.ts` (middleware)
- **Password Hashing**: bcrypt with 10 rounds
- **Token Expiration**: 24 hours (configurable)

**Alternatives Considered**:

- **NextAuth.js**: Overkill for single admin user
- **Supabase Auth**: Unnecessary complexity for simple use case
- **Session Cookies**: Stateful, requires session store

**Trade-offs**:

- ✅ **Pro**: Simple, lightweight, full control
- ❌ **Con**: Manual implementation, must maintain security best practices

**Security Notes**:

- JWT secret stored in `JWT_SECRET` environment variable
- Middleware protects all `/admin/*` routes
- Tokens cannot be revoked (logout is client-side only)

**References**:

- `lib/auth.ts:1` - Node.js JWT implementation
- `lib/auth-edge.ts:1` - Edge runtime JWT implementation
- `middleware.ts:1` - Route protection
- `app/api/admin/auth/route.ts:1` - Login endpoint

---

### ADR-004: n8n for WhatsApp Integration

**Status**: ✅ Adopted **Date**: 2025-10-15 **Context**: Need to send WhatsApp
Business API messages without managing WhatsApp infrastructure

**Decision**: Use n8n workflow automation to send WhatsApp messages via webhook

**Rationale**:

- **No WhatsApp API Management**: n8n handles WhatsApp Business API credentials
- **Visual Workflow**: Non-developers can modify message templates
- **Webhook Simplicity**: App just POSTs to webhook URL
- **Retry Logic**: n8n handles message delivery retries
- **Audit Trail**: n8n logs all sent messages
- **Template Management**: WhatsApp templates managed in n8n

**Implementation Flow**:

1. App creates service request
2. App POSTs to `N8N_WEBHOOK_URL` with phone + message
3. n8n workflow sends WhatsApp message
4. n8n calls back to app to update `whatsapp_sent_at`

**Alternatives Considered**:

- **Direct WhatsApp Business API**: Complex setup, requires Meta approval
- **Twilio WhatsApp**: Expensive, still requires template approval
- **In-App WhatsApp Library**: Must manage API credentials and retries

**Trade-offs**:

- ✅ **Pro**: Zero WhatsApp infrastructure, visual template editor
- ❌ **Con**: External dependency, single point of failure

**Failure Handling**:

- If n8n is down, app logs error but doesn't block request creation
- Manual fallback: Admin can copy link and send via personal WhatsApp

**References**:

- `app/api/webhooks/send-whatsapp/route.ts:1` - Webhook sender
- `docs/WEBHOOK_DOCUMENTATION.md` - n8n setup guide
- Environment variable: `N8N_WEBHOOK_URL`

---

### ADR-005: Mobile-First Design with Tailwind CSS

**Status**: ✅ Adopted **Date**: 2025-10-15 **Context**: Customers primarily
access the app on mobile devices

**Decision**: Design mobile-first UI with Tailwind CSS 4

**Rationale**:

- **Mobile Usage**: 90%+ of customers access estimates on smartphones
- **Tailwind Utility Classes**: Fast prototyping, consistent design system
- **Responsive by Default**: Mobile-first breakpoints (sm, md, lg)
- **Custom Components**: `components/mobile/` directory for mobile-specific UI
- **No CSS-in-JS Runtime**: Faster performance than styled-components

**Mobile-Specific Components**:

- `AppHeader.tsx` - Compact mobile header
- `StickyActionBar.tsx` - Fixed bottom action buttons
- `SelectionCard.tsx` - Touch-optimized service selection
- `Toast.tsx` - Mobile notifications

**Tailwind Configuration**:

- `tailwindcss` v4 with PostCSS
- Custom colors, animations in `app/globals.css`
- `@tailwindcss/postcss` for v4 architecture

**Alternatives Considered**:

- **Bootstrap**: Less customizable, heavier bundle
- **Chakra UI**: Component library overhead, larger bundle
- **Plain CSS**: Harder to maintain, no design system

**Trade-offs**:

- ✅ **Pro**: Fast iteration, small bundle, consistent design
- ❌ **Con**: Verbose class names, requires Tailwind knowledge

**References**:

- `tailwind.config.ts:1` - Tailwind configuration
- `components/mobile/` - Mobile components
- `app/globals.css:1` - Global styles

---

### ADR-006: Zod for Runtime Validation

**Status**: ✅ Adopted **Date**: 2025-10-15 **Context**: Need runtime validation
for API inputs to prevent invalid data in database

**Decision**: Use Zod for schema validation with TypeScript type inference

**Rationale**:

- **Type Safety**: Zod schemas generate TypeScript types automatically
- **Runtime Validation**: Catch invalid data before database insertion
- **Composable Schemas**: Reuse schemas across endpoints
- **Clear Error Messages**: User-friendly validation errors
- **Transform Support**: Auto-format phone numbers (add "91" prefix)
- **Lightweight**: Small bundle size compared to alternatives

**Example Usage**:

```typescript
const result = createRequestSchema.safeParse(body)
if (!result.success) {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: result.error.issues,
    },
    { status: 400 }
  )
}
```

**Alternatives Considered**:

- **Yup**: Similar but less TypeScript-native
- **Joi**: Node.js focused, larger bundle
- **Manual Validation**: Error-prone, no type inference

**Trade-offs**:

- ✅ **Pro**: Excellent TypeScript integration, small bundle
- ❌ **Con**: Learning curve for complex schemas

**References**:

- `lib/validations.ts:1` - All validation schemas
- `package.json:28` - zod dependency

---

### ADR-007: Pricing in Paise (Not Rupees)

**Status**: ✅ Adopted **Date**: 2025-10-15 **Context**: Need accurate currency
handling without floating-point errors

**Decision**: Store all prices in paise (smallest currency unit)

**Rationale**:

- **Precision**: Avoid floating-point arithmetic errors (0.1 + 0.2 ≠ 0.3)
- **Integer Math**: All calculations use integers (fast, accurate)
- **Standard Practice**: Used by Stripe, PayPal, and most payment processors
- **Database Simplicity**: `INTEGER` column type, no `DECIMAL` needed

**Convention**:

- 1 Rupee = 100 paise
- ₹1,500.00 = 150000 paise
- All database columns: `price_paise`, `lacarte_paise`, `total_paise`

**Display Formatting**:

- `formatCurrency(paise)` utility converts to rupees
- Example: `formatCurrency(150000)` → `₹1,500.00`

**Alternatives Considered**:

- **Decimal/Float**: Prone to rounding errors
- **String**: Complex arithmetic, type safety issues
- **BigInt**: Overkill for currency range

**Trade-offs**:

- ✅ **Pro**: Accurate calculations, standard practice
- ❌ **Con**: Must remember to convert for display

**References**:

- `lib/utils.ts:formatCurrency()` - Display formatting
- `db/schema.sql` - All `price_paise` columns
- `docs/DATABASE.md#pricing-convention` - Documentation

---

### ADR-008: Auto-Generated Short Slugs

**Status**: ✅ Adopted **Date**: 2025-10-15 **Context**: Need customer-friendly
URLs without exposing sequential IDs

**Decision**: Generate random 8-character alphanumeric slugs in database

**Rationale**:

- **Security**: Sequential IDs reveal business metrics (order volume)
- **Customer-Friendly**: Short, easy-to-share URLs (e.g., `/o/ABC12XYZ`)
- **Database-Level**: Guaranteed uniqueness via trigger
- **Collision Handling**: Auto-retry if slug exists

**Implementation**:

- PostgreSQL function `generate_short_slug()`
- BEFORE INSERT trigger on `requests` table
- Charset: `A-Z0-9` (36 characters)
- Length: 8 characters = 36^8 = 2.8 trillion combinations

**Collision Probability**:

- At 1M requests: ~0.00000003% collision probability
- Trigger handles collisions by regenerating

**Alternatives Considered**:

- **UUID in URL**: Too long, not user-friendly
- **Sequential ID**: Exposes order volume, easy to enumerate
- **Nanoid**: App-level generation, must handle collisions manually

**Trade-offs**:

- ✅ **Pro**: Secure, short, customer-friendly
- ❌ **Con**: Very slight performance overhead (negligible)

**References**:

- `db/schema.sql:96` - `generate_short_slug()` function
- `db/schema.sql:120` - Trigger implementation

---

### ADR-009: No Payment Processing (Estimates Only)

**Status**: ✅ Adopted **Date**: 2025-10-15 **Context**: CycleBees handles
payments manually after service completion

**Decision**: App generates estimates only, no payment gateway integration

**Rationale**:

- **Business Model**: Payment collected in person after service
- **Simplicity**: No PCI compliance, no payment gateway fees
- **Trust**: Customers prefer paying after seeing work quality
- **Cash Flow**: Most customers pay cash or UPI after service

**Impact**:

- No `payments` table in database
- No Stripe/Razorpay integration
- Estimates serve as invoices for record-keeping

**Alternatives Considered**:

- **Razorpay/Stripe Integration**: Adds complexity, not needed
- **UPI QR Codes**: Considered for future (low priority)

**Trade-offs**:

- ✅ **Pro**: Simpler codebase, no payment failures
- ❌ **Con**: Manual payment tracking, no digital receipts

**Future Consideration**:

- Add payment status tracking (`paid`, `unpaid`)
- Integrate UPI QR codes for digital payments (Phase 8)

**References**:

- `db/schema.sql:86` - Comment: "Payments table removed"

---

### ADR-010: Turbopack for Development

**Status**: ✅ Adopted **Date**: 2025-10-15 **Context**: Webpack dev server slow
for large Next.js apps

**Decision**: Use Turbopack (Rust-based bundler) for development

**Rationale**:

- **Speed**: 10x faster than Webpack for incremental builds
- **Next.js Native**: Built-in Next.js 15 support
- **HMR Performance**: Near-instant hot module replacement
- **Future Default**: Will replace Webpack in Next.js 16

**Configuration**:

- `npm run dev` uses `--turbopack` flag
- `npm run build` still uses Webpack (Turbopack build support coming)

**Alternatives Considered**:

- **Webpack**: Default, slower, but more stable
- **Vite**: Fast but not Next.js native

**Trade-offs**:

- ✅ **Pro**: Significantly faster development experience
- ❌ **Con**: Still experimental, some plugins unsupported

**References**:

- `package.json:6` - `next dev --turbopack`
- `package.json:7` - `next build --turbopack`

---

## Technology Stack

### Frontend

| Technology          | Version | Purpose               |
| ------------------- | ------- | --------------------- |
| **React**           | 19.1.0  | UI library            |
| **Next.js**         | 15.5.2  | Full-stack framework  |
| **TypeScript**      | 5.x     | Type safety           |
| **Tailwind CSS**    | 4.x     | Styling               |
| **Zod**             | 4.1.5   | Runtime validation    |
| **React Hook Form** | 7.62.0  | Form state management |
| **Lucide React**    | 0.542.0 | Icon library          |
| **html2pdf.js**     | 0.12.0  | PDF generation        |

### Backend

| Technology   | Version            | Purpose                       |
| ------------ | ------------------ | ----------------------------- |
| **Node.js**  | 18+                | Server runtime                |
| **Supabase** | 2.57.2             | PostgreSQL database           |
| **JWT**      | jsonwebtoken 9.0.2 | Authentication (Node.js)      |
| **jose**     | 6.1.0              | Authentication (Edge runtime) |
| **bcrypt**   | 6.0.0              | Password hashing              |

### Development Tools

| Technology      | Version | Purpose              |
| --------------- | ------- | -------------------- |
| **ESLint**      | 9.x     | Code linting         |
| **Prettier**    | 3.6.2   | Code formatting      |
| **Husky**       | 9.1.7   | Git hooks            |
| **lint-staged** | 16.2.4  | Pre-commit linting   |
| **tsx**         | 4.20.6  | TypeScript execution |

**See**: `package.json:1` for complete dependency list

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Admin Dashboard (Web)          Customer Portal (Mobile)        │
│  ┌──────────────┐               ┌──────────────┐               │
│  │ /admin/*     │               │ /o/[slug]/*  │               │
│  │ React 19     │               │ React 19     │               │
│  │ Mobile-first │               │ Mobile-only  │               │
│  └──────────────┘               └──────────────┘               │
└───────────────────────┬─────────────────┬───────────────────────┘
                        │                 │
                        ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                   Next.js 15 App Router                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Server Components (RSC)    Client Components (RCC)       │ │
│  │  ┌──────────────┐           ┌──────────────┐             │ │
│  │  │ Page.tsx     │           │ Form.tsx     │             │ │
│  │  │ Layout.tsx   │           │ Modal.tsx    │             │ │
│  │  └──────────────┘           └──────────────┘             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  API Routes (/api/*)                                       │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ /admin/*     │  │ /requests/*  │  │ /webhooks/*  │    │ │
│  │  │ JWT Required │  │ Mixed Auth   │  │ Public       │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Middleware (Edge Runtime)                                 │ │
│  │  - JWT Verification                                        │ │
│  │  - Route Protection (/admin/*)                             │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────┬────────────────────┬────────────────────┘
                        │                    │
                        ▼                    ▼
┌─────────────────────────────────┐  ┌───────────────────────────┐
│       DATA LAYER                │  │   EXTERNAL SERVICES       │
├─────────────────────────────────┤  ├───────────────────────────┤
│  Supabase PostgreSQL            │  │  n8n WhatsApp Webhook     │
│  ┌────────────────────────────┐ │  │  ┌──────────────────────┐ │
│  │ requests                   │ │  │  │ POST /webhook         │ │
│  │ request_items              │ │  │  │ - Send WhatsApp msg  │ │
│  │ addons                     │ │  │  │ - Update delivery    │ │
│  │ admin_credentials          │ │  │  └──────────────────────┘ │
│  │ confirmed_order_*          │ │  │                           │
│  └────────────────────────────┘ │  │  WhatsApp Business API    │
│                                 │  │  (Managed by n8n)         │
└─────────────────────────────────┘  └───────────────────────────┘
```

---

## Data Flow

### Admin Creates Service Request

```
1. Admin fills form (/admin/new)
   ↓
2. Client validates with Zod
   ↓
3. POST /api/requests
   ├─ Validate request body (Zod)
   ├─ Insert into `requests` table
   │  └─ Trigger: Auto-generate `short_slug`
   ├─ Insert `request_items` (repair/replacement)
   │  └─ Trigger: Auto-calculate `total_paise`
   └─ Return { id, short_slug }
   ↓
4. Admin clicks "Send WhatsApp"
   ↓
5. POST /api/webhooks/send-whatsapp
   ├─ Payload: { phone, order_id, slug, total }
   ├─ Forward to n8n webhook
   │  └─ n8n sends WhatsApp message
   │  └─ n8n calls PATCH /api/requests/[id]/update-whatsapp-status
   └─ Update `whatsapp_sent_at` timestamp
   ↓
6. Customer receives WhatsApp with link
```

### Customer Views & Confirms Order

```
1. Customer clicks WhatsApp link → /o/ABC12XYZ
   ↓
2. GET /api/public/orders/ABC12XYZ
   ├─ Fetch request by `short_slug`
   ├─ Fetch `request_items`
   └─ Return estimate data
   ↓
3. Customer selects services & addons
   ↓
4. Customer clicks "Confirm Order"
   ↓
5. POST /api/public/orders/ABC12XYZ/view
   ├─ Payload: { status: 'confirmed', selected_items, selected_addons }
   ├─ Update `requests.status` = 'confirmed'
   ├─ Insert into `confirmed_order_services`
   ├─ Insert into `confirmed_order_addons`
   └─ Return { message, total_paise }
   ↓
6. Admin sees updated status in dashboard
```

---

## Security Architecture

### Authentication Flow

```
┌──────────────┐
│ Admin Login  │
│ /admin/login │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────────┐
│ POST /api/admin/auth               │
│ 1. Validate username/password      │
│ 2. Fetch admin from DB             │
│ 3. Verify bcrypt hash              │
│ 4. Generate JWT token              │
│    - Payload: { userId, username } │
│    - Expires: 24h                  │
│ 5. Return { token }                │
└──────────────┬─────────────────────┘
               │
               ▼
┌────────────────────────────────────┐
│ Client stores JWT in localStorage  │
│ Includes in all requests:          │
│ Authorization: Bearer <token>      │
└──────────────┬─────────────────────┘
               │
               ▼
┌────────────────────────────────────┐
│ Middleware (/admin/*)              │
│ 1. Extract token from header       │
│ 2. Verify JWT signature            │
│ 3. Check expiration                │
│ 4. Allow/deny request              │
└────────────────────────────────────┘
```

**Key Security Measures**:

- Passwords hashed with bcrypt (10 rounds)
- JWT signed with secret key (HS256)
- Middleware blocks all `/admin/*` routes without valid token
- Tokens stored client-side only (localStorage)

**Known Limitations**:

- No token refresh mechanism
- Logout is client-side only (delete token)
- Tokens cannot be revoked server-side
- No rate limiting (planned for Phase 6)

---

### Current Security Gaps (Phase 6 TODO)

1. **No Row Level Security (RLS)**
   - Database exposed if Supabase keys leak
   - Solution: Enable RLS policies per table

2. **No Rate Limiting**
   - APIs vulnerable to brute-force attacks
   - Solution: Implement `@upstash/ratelimit`

3. **Default Admin Password in Schema**
   - Plain text password in `db/schema.sql`
   - Solution: Run `scripts/admin/hash-passwords.ts` before production

4. **No Error Logging**
   - Server errors logged to console only
   - Solution: Integrate Sentry or similar

**See**: `docs/PROJECT_TRACKER.md` Phase 6 for detailed security roadmap

---

## Deployment Architecture

### Vercel Deployment (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                       Vercel Platform                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Edge Network (Global CDN)                                  │
│  ├─ Static Assets (/public/*, /_next/static/*)             │
│  ├─ Image Optimization (next/image)                        │
│  └─ Edge Runtime (middleware.ts)                           │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Serverless Functions (Auto-Scaled)                   │ │
│  │  ├─ API Routes (/api/*)                               │ │
│  │  │  └─ Timeout: 10s (free), 60s (pro)                │ │
│  │  └─ Server Components (Page Rendering)                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Environment Variables (Encrypted)                          │
│  ├─ NEXT_PUBLIC_SUPABASE_URL                               │
│  ├─ NEXT_PUBLIC_SUPABASE_ANON_KEY                          │
│  ├─ JWT_SECRET                                              │
│  ├─ N8N_WEBHOOK_URL                                         │
│  └─ NEXT_PUBLIC_BASE_URL                                    │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
├─────────────────────────────────────────────────────────────┤
│  Supabase (Database)     n8n (WhatsApp)     Cloudinary      │
│  - PostgreSQL 15         - Webhook          - Logo hosting  │
│  - Auto Backups          - Templates        - CDN           │
└─────────────────────────────────────────────────────────────┘
```

**Deployment Steps**:

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Vercel auto-deploys on git push to `main`
4. Preview deployments for all branches

**See**: `docs/DEPLOYMENT_GUIDE.md` for detailed instructions

---

## Future Considerations

### Phase 5: Testing Infrastructure

**Planned Improvements**:

- Jest + React Testing Library
- Unit tests for utilities (`lib/utils.ts`, `lib/validations.ts`)
- Integration tests for API endpoints
- > 60% code coverage target

**Rationale**: Catch regressions early, improve code confidence

---

### Phase 6: Security & Performance

**Planned Improvements**:

- API rate limiting (`@upstash/ratelimit`)
- Row Level Security (RLS) policies
- Input sanitization (XSS prevention)
- Error logging (Sentry)
- Performance audit (Lighthouse)

**Rationale**: Production-grade security and performance

---

### Phase 8: CI/CD Pipeline

**Planned Improvements**:

- GitHub Actions workflow (lint, test, build on PR)
- Vercel deployment configuration
- Staging environment
- Automated rollback procedures

**Rationale**: Automated quality checks, safer deployments

---

## Additional Resources

- **API Documentation**: `docs/API.md`
- **Database Schema**: `docs/DATABASE.md`
- **Deployment Guide**: `docs/DEPLOYMENT_GUIDE.md`
- **Testing Guide**: `docs/TESTING_GUIDE.md`
- **Project Tracker**: `docs/PROJECT_TRACKER.md`

---

**Last Updated**: 2025-10-19 **Maintained By**: CycleBees Development Team
