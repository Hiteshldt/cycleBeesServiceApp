# CycleBees - WhatsApp Service Request System

> **Automated bike service request management with WhatsApp integration**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)

---

## Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup)
- [Scripts](#-scripts)
- [Development Workflow](#-development-workflow)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Documentation](#-documentation)
- [Contributing](#-contributing)

---

## 📋 Overview

**CycleBees** is a Next.js application that streamlines bike service requests by automatically sending WhatsApp messages to customers with order details, service estimates, and order tracking. The system provides an admin dashboard for creating and managing service requests, and a customer portal for viewing estimates, selecting services, and confirming orders.

### Key Features

- **Automated WhatsApp Messaging** - Sends personalized service estimates via n8n workflow integration with WhatsApp Business API
- **Admin Dashboard** - Complete service request management with real-time status tracking
- **Customer Portal** - Mobile-optimized order viewing, service selection, and confirmation
- **Dynamic Pricing** - La Carte pricing with configurable discounts, addons, and service bundles
- **PDF Generation** - Automatic bill generation and download for confirmed orders
- **Real-time Tracking** - Status tracking: `pending` → `sent` → `viewed` → `confirmed`
- **Error Handling** - Comprehensive error detection and retry logic for WhatsApp delivery
- **Mobile-First Design** - Responsive UI optimized for mobile customer experience

---

## ✨ Features

### For Admins

- ✅ Create service requests with bike details and customer info
- ✅ Add repair and replacement items with suggested services
- ✅ Configure addons (e.g., "Premium Bike Wash", "Engine Deep Clean")
- ✅ Create service bundles (e.g., "Basic Service Package")
- ✅ Manage La Carte pricing and discounts
- ✅ Send WhatsApp notifications with unique order links
- ✅ Track order status and view analytics
- ✅ Add internal notes to requests

### For Customers

- ✅ Receive WhatsApp message with personalized order link
- ✅ View service estimate with itemized breakdown
- ✅ Select/deselect suggested services
- ✅ Add optional addon services
- ✅ Choose service bundles
- ✅ Confirm final order with total amount
- ✅ Download PDF bill for confirmed orders
- ✅ Contact support via WhatsApp

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Supabase** account ([Sign up free](https://supabase.com/))
- **n8n** instance with WhatsApp Business API configured ([n8n Cloud](https://n8n.io/) or self-hosted)

### Installation

```bash
# 1. Clone the repository (or download source)
git clone <repository-url>
cd cyclebees-services

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local

# Edit .env.local with your actual credentials:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - N8N_WEBHOOK_URL
# - JWT_SECRET
# - NEXT_PUBLIC_BASE_URL

# 4. Set up database (see Database Setup section below)

# 5. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First-Time Setup Checklist

- [ ] Environment variables configured in `.env.local`
- [ ] Supabase project created and database schema deployed
- [ ] n8n workflow created and activated (see `docs/WEBHOOK_DOCUMENTATION.md`)
- [ ] Admin credentials created (use `scripts/admin/hash-passwords.ts`)
- [ ] Test WhatsApp message sent successfully
- [ ] Customer portal accessible via order slug

---

## 🏗️ Tech Stack

### Core Framework

- **Next.js** 15.5.2 - React framework with App Router and Turbopack
- **React** 19.1.0 - UI library
- **TypeScript** 5 - Type-safe development

### Backend & Database

- **Supabase** - PostgreSQL database as a service
- **PostgreSQL** - Relational database with triggers and functions
- **Next.js API Routes** - RESTful API endpoints

### Authentication & Security

- **JWT** (jsonwebtoken + jose) - Token-based authentication
- **bcrypt** - Password hashing
- **Zod** - Runtime schema validation

### Frontend & Styling

- **Tailwind CSS** 4 - Utility-first CSS framework
- **React Hook Form** - Form state management
- **Lucide React** - Icon library

### External Integrations

- **n8n** - Workflow automation platform
- **WhatsApp Business API** - Messaging (via n8n)
- **html2pdf.js** - Client-side PDF generation

### Development Tools

- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Turbopack** - Fast bundler

---

## 📁 Project Structure

```
cyclebees-services/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin dashboard pages
│   │   ├── page.tsx              # Dashboard home (request list)
│   │   ├── login/page.tsx        # Admin login
│   │   ├── new/page.tsx          # Create new request
│   │   ├── addons/page.tsx       # Manage addons
│   │   ├── analytics/page.tsx    # Analytics dashboard
│   │   ├── settings/page.tsx     # System settings
│   │   └── layout.tsx            # Admin layout with auth
│   ├── o/[slug]/                 # Customer portal (order pages)
│   │   ├── page.tsx              # Order summary & confirmation
│   │   ├── services/page.tsx     # Service selection
│   │   ├── addons/page.tsx       # Addon selection
│   │   └── bundles/page.tsx      # Bundle selection
│   ├── lookup/page.tsx           # Order lookup page
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin-only endpoints
│   │   │   ├── auth/route.ts     # Authentication
│   │   │   ├── addons/           # Addon CRUD
│   │   │   ├── bundles/          # Bundle CRUD
│   │   │   └── lacarte/route.ts  # La Carte pricing
│   │   ├── requests/             # Request CRUD
│   │   │   ├── route.ts          # List/create
│   │   │   ├── [id]/route.ts     # Get/update/delete
│   │   │   ├── [id]/items/       # Line items
│   │   │   ├── [id]/notes/       # Notes
│   │   │   ├── [id]/confirmed/   # Confirmation
│   │   │   └── [id]/pdf/         # PDF generation
│   │   ├── webhooks/
│   │   │   └── send-whatsapp/    # n8n webhook integration
│   │   └── public/               # Public endpoints
│   │       ├── lookup/           # Order lookup
│   │       └── orders/[slug]/    # Order details
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── modal.tsx
│   │   └── pagination.tsx
│   ├── mobile/                   # Mobile-specific components
│   │   ├── AppHeader.tsx
│   │   ├── CategorySection.tsx
│   │   ├── SelectionCard.tsx
│   │   ├── StickyActionBar.tsx
│   │   └── Toast.tsx
│   ├── BillPreview.tsx           # Bill preview modal
│   ├── DownloadModal.tsx         # Download options
│   └── NotesManager.tsx          # Notes management
│
├── lib/                          # Shared libraries
│   ├── supabase.ts               # Supabase client & types
│   ├── auth.ts                   # JWT auth (Node.js runtime)
│   ├── auth-edge.ts              # JWT auth (Edge runtime)
│   ├── validations.ts            # Zod schemas
│   ├── utils.ts                  # Helper functions
│   ├── notification.ts           # Notification system
│   ├── bill-generator.ts         # PDF generation
│   └── lacarte.ts                # La Carte pricing logic
│
├── types/                        # TypeScript types
│   └── html2pdf.d.ts             # html2pdf type definitions
│
├── db/                           # Database (renamed from database/)
│   ├── schema.sql                # Complete schema
│   └── migrations/               # Migration scripts
│
├── scripts/                      # Utility scripts
│   ├── db/                       # Database scripts
│   │   └── check-database.ts     # Database verification
│   ├── admin/                    # Admin scripts
│   │   └── hash-passwords.ts     # Password hashing
│   ├── verify-env.sh             # Environment validation
│   ├── sanity-check.sh           # Full sanity check
│   └── list-deletion-candidates.sh
│
├── docs/                         # Documentation
│   ├── PROJECT_TRACKER.md        # Refactor progress
│   ├── DELETION_CANDIDATES.md    # Cleanup tracking
│   ├── DEPLOYMENT_GUIDE.md       # Deployment instructions
│   ├── TESTING_GUIDE.md          # Testing procedures
│   ├── WEBHOOK_DOCUMENTATION.md  # n8n integration
│   └── BUILD_PLAN.md             # Build specifications
│
├── public/                       # Static assets
│   ├── logo.png
│   └── notification-sound.mp3
│
├── middleware.ts                 # Next.js middleware (auth)
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── next.config.ts                # Next.js config
├── postcss.config.mjs            # PostCSS config
└── eslint.config.mjs             # ESLint config
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# ============================================================================
# Supabase Configuration
# ============================================================================
# Your Supabase project URL (find in Supabase Dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase anonymous/public API key (find in Supabase Dashboard > Settings > API)
# This is safe to expose in the browser
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# ============================================================================
# n8n WhatsApp Automation
# ============================================================================
# Your n8n webhook URL for sending WhatsApp messages
# Format: https://your-n8n-instance.app.n8n.cloud/webhook-test/send-template
N8N_WEBHOOK_URL=https://example.app.n8n.cloud/webhook-test/send-template

# ============================================================================
# JWT Authentication
# ============================================================================
# Secret key for signing JWT tokens (MUST BE KEPT SECRET!)
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-here-at-least-64-characters-long

# ============================================================================
# Application Base URL
# ============================================================================
# Base URL for generating customer portal links
# Development: http://localhost:3000
# Production: https://your-domain.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Security Notes:**
- **NEVER** commit `.env.local` to git (it's in `.gitignore`)
- **NEVER** share your `JWT_SECRET` or Supabase service role key
- Use different secrets for development and production
- Rotate secrets periodically

### Generating JWT Secret

```bash
# Node.js method (recommended)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL method (alternative)
openssl rand -hex 64
```

### Verifying Environment Variables

Run the verification script to check if all required environment variables are set:

```bash
# When created (see scripts section)
bash scripts/verify-env.sh
```

---

## 🗄️ Database Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Note your project URL and anon key

### 2. Run Database Schema

1. Open Supabase SQL Editor
2. Copy contents of `db/schema.sql`
3. Run the SQL script

This creates:
- All tables (`requests`, `request_items`, `addons`, `service_bundles`, etc.)
- Indexes for performance
- Triggers for auto-generated slugs and totals
- Sample data (addons, admin user)

### 3. Run Migrations (if needed)

```bash
# From Supabase SQL Editor, run:
# db/migrations/001_add_pending_status.sql
```

### 4. Create Admin User

```bash
# Generate password hash
cd scripts/admin
npx tsx hash-passwords.ts
# Enter desired password when prompted

# Then insert into Supabase:
# INSERT INTO admin_credentials (username, password)
# VALUES ('admin', 'your-bcrypt-hash-here');
```

### Database Schema Overview

**Main Tables:**
- `requests` - Service requests with WhatsApp tracking
- `request_items` - Line items (repairs/replacements)
- `addons` - Add-on services catalog
- `service_bundles` - Service packages
- `admin_credentials` - Admin users
- `confirmed_order_services` - Customer selections (junction)
- `confirmed_order_addons` - Customer addon selections (junction)

**Key Features:**
- Auto-generated `short_slug` (8-character unique ID)
- Auto-calculated totals via PostgreSQL triggers
- Status tracking: `pending` | `sent` | `viewed` | `confirmed` | `cancelled`
- Comprehensive indexes for performance

See `docs/DATABASE.md` (when created) for full schema documentation.

---

## 📜 Scripts

### Available npm Scripts

```bash
# Development
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx tsx scripts/db/check-database.ts      # Verify database connection

# Admin
npx tsx scripts/admin/hash-passwords.ts   # Generate password hashes
```

### Utility Scripts (to be created)

```bash
# Environment validation
bash scripts/verify-env.sh               # Check all env vars are set

# Sanity check (full test suite)
bash scripts/sanity-check.sh             # Run all checks (lint, build, tests)

# Deletion candidates
bash scripts/list-deletion-candidates.sh  # List files marked for deletion
bash scripts/remove-deletion-candidates.sh --dry-run  # Preview deletions
```

---

## 💻 Development Workflow

### Running Locally

```bash
# 1. Start development server
npm run dev

# 2. Open browser
# - Admin: http://localhost:3000/admin/login
# - Customer: http://localhost:3000/o/{slug} (get slug from created request)
# - Home: http://localhost:3000

# 3. Watch for changes
# Turbopack will auto-reload on file changes
```

### Creating a Test Request

1. Go to `http://localhost:3000/admin/login`
2. Login with admin credentials
3. Click "Create New Request"
4. Fill in bike name, customer name, phone (10 digits, e.g., `9876543210`)
5. Add repair/replacement items
6. Click "Save Request"
7. Note the `short_slug` (e.g., `abc123xy`)
8. Customer link: `http://localhost:3000/o/abc123xy`

### Code Style

- **TypeScript strict mode** enabled
- **ESLint** for linting
- **Prettier** (to be configured) for formatting
- **Conventional commits** recommended (e.g., `feat:`, `fix:`, `docs:`)

---

## 🧪 Testing

### Manual Testing (Current)

See `docs/TESTING_GUIDE.md` for complete manual test procedures.

**Quick Test Checklist:**
- [ ] Admin can login
- [ ] Admin can create request
- [ ] WhatsApp notification sends successfully
- [ ] Customer can view order
- [ ] Customer can select services
- [ ] Customer can confirm order
- [ ] PDF download works

### Automated Testing (Planned)

```bash
# To be implemented (Phase 5 of refactor)
npm test              # Run test suite
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Test Infrastructure To-Do:**
- [ ] Set up Jest + React Testing Library
- [ ] Unit tests for utilities and validation
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical user flows

---

## 🚢 Deployment

### Production Deployment (Vercel - Recommended)

#### Prerequisites
- Vercel account ([Sign up free](https://vercel.com/))
- Production Supabase project
- n8n workflow configured for production

#### Steps

1. **Prepare Supabase Production Database**
   ```bash
   # 1. Create production Supabase project
   # 2. Run db/schema.sql in production SQL Editor
   # 3. Run db/migrations/*.sql
   # 4. Create admin user with hash-passwords.ts
   ```

2. **Configure Vercel**
   ```bash
   # Install Vercel CLI (optional)
   npm i -g vercel

   # Link project
   vercel link

   # Set environment variables in Vercel Dashboard
   # or via CLI:
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add N8N_WEBHOOK_URL production
   vercel env add JWT_SECRET production
   vercel env add NEXT_PUBLIC_BASE_URL production
   ```

3. **Deploy**
   ```bash
   # Option 1: Git push (auto-deploy)
   git push origin main

   # Option 2: Manual deploy
   vercel --prod
   ```

4. **Verify Deployment**
   - [ ] Visit production URL
   - [ ] Test admin login
   - [ ] Test WhatsApp sending
   - [ ] Test customer portal
   - [ ] Check error logs

### Other Deployment Options

- **Docker**: Create `Dockerfile` (not yet implemented)
- **AWS/GCP**: Deploy as Node.js app
- **Self-hosted**: Run `npm run build && npm start`

See `docs/DEPLOYMENT_GUIDE.md` for comprehensive deployment documentation.

---

## 🐛 Troubleshooting

### Common Issues

#### 1. WhatsApp Messages Not Sending

**Symptoms:** All requests stuck in `pending` status

**Solutions:**
```bash
# Check environment variable
echo $N8N_WEBHOOK_URL

# Verify n8n workflow is activated
# Check n8n dashboard

# Verify "Continue On Fail" is enabled in WhatsApp node
# This prevents workflow from stopping on API errors
```

#### 2. Database Connection Errors

**Symptoms:** `Error connecting to database` on page load

**Solutions:**
```bash
# Verify Supabase credentials
bash scripts/verify-env.sh

# Check Supabase project status
# Go to Supabase Dashboard > Project Settings

# Verify network connectivity
curl -I $NEXT_PUBLIC_SUPABASE_URL
```

#### 3. Admin Login Not Working

**Symptoms:** "Invalid credentials" error

**Solutions:**
```bash
# Verify admin user exists in database
# Run in Supabase SQL Editor:
SELECT username FROM admin_credentials;

# Generate new password hash
npx tsx scripts/admin/hash-passwords.ts

# Update password in database
UPDATE admin_credentials SET password='new-hash' WHERE username='admin';
```

#### 4. Build Errors

**Symptoms:** `npm run build` fails with TypeScript errors

**Solutions:**
```bash
# Clear build cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit

# Verify Node.js version
node --version  # Should be 18+
```

#### 5. Environment Variables Not Loading

**Symptoms:** `undefined` when accessing `process.env.NEXT_PUBLIC_*`

**Solutions:**
```bash
# Verify .env.local exists
ls -la .env.local

# Restart dev server (required after env changes)
# Ctrl+C to stop, then npm run dev

# Check variable names (must start with NEXT_PUBLIC_ for client-side)
cat .env.local | grep NEXT_PUBLIC
```

### Getting Help

1. **Check logs**:
   - Browser console (F12)
   - Terminal output (dev server)
   - Vercel deployment logs (if deployed)
   - Supabase logs (Supabase Dashboard)
   - n8n execution logs

2. **Review documentation**:
   - `docs/DEPLOYMENT_GUIDE.md`
   - `docs/TESTING_GUIDE.md`
   - `docs/WEBHOOK_DOCUMENTATION.md`

3. **Contact support**: [Your contact info here]

---

## 📚 Documentation

### Core Documentation

- **[PROJECT_TRACKER.md](docs/PROJECT_TRACKER.md)** - Refactor progress and project management
- **[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[TESTING_GUIDE.md](docs/TESTING_GUIDE.md)** - Manual testing procedures
- **[WEBHOOK_DOCUMENTATION.md](docs/WEBHOOK_DOCUMENTATION.md)** - n8n webhook integration
- **[BUILD_PLAN.md](docs/BUILD_PLAN.md)** - Original build specifications
- **[DELETION_CANDIDATES.md](docs/DELETION_CANDIDATES.md)** - Cleanup tracking

### API Documentation

(To be created in `docs/API.md`)

**Base URL**: `http://localhost:3000/api`

**Admin Endpoints** (Require JWT):
- `POST /api/admin/auth` - Login
- `GET /api/requests` - List requests
- `POST /api/requests` - Create request
- `GET /api/admin/addons` - Manage addons
- `GET /api/admin/bundles` - Manage bundles

**Public Endpoints**:
- `GET /api/public/lookup` - Order lookup
- `GET /api/public/orders/{slug}` - Order details
- `POST /api/public/orders/{slug}/view` - Mark viewed/confirmed

See full API documentation in `docs/API.md` (when created).

---

## 🤝 Contributing

### Getting Started

1. **Fork the repository** (if open source) or get access
2. **Clone your fork**:
   ```bash
   git clone <your-fork-url>
   cd cyclebees-services
   ```
3. **Install dependencies**: `npm install`
4. **Set up environment**: Copy `.env.example` to `.env.local`
5. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Guidelines

- **Code Style**: Follow ESLint rules (`npm run lint`)
- **TypeScript**: Maintain strict type safety
- **Commits**: Use conventional commit format
  ```
  feat: add addon selection UI
  fix: resolve WhatsApp timeout issue
  docs: update deployment guide
  refactor: extract shared auth logic
  ```
- **Testing**: Add tests for new features (when test infrastructure is ready)

### Pull Request Process

1. **Update documentation** if needed
2. **Run checks**:
   ```bash
   npm run lint
   npm run build
   # npm test (when available)
   ```
3. **Create pull request** with clear description
4. **Request review** from maintainers

### Code Review Checklist

- [ ] Code follows project style guidelines
- [ ] All TypeScript errors resolved
- [ ] No console.log or debug code left in
- [ ] Environment variables properly used (no hardcoded secrets)
- [ ] Documentation updated
- [ ] Tests pass (when available)

---

## 📄 License

**Proprietary** - CycleBees

All rights reserved. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

---

## 🙏 Acknowledgments

- **Next.js** team for the amazing framework
- **Supabase** for managed PostgreSQL
- **n8n** community for workflow automation
- **Tailwind CSS** for utility-first CSS

---

## 📞 Support

For issues, questions, or support:

- **Email**: [support@cyclebees.com] (replace with actual email)
- **Phone**: +91 95973 12212
- **Documentation**: See `docs/` directory

---

**Built with ❤️ for efficient bike service management**

Last Updated: 2025-10-19
