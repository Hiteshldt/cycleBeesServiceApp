# 🚴 CycleBees - WhatsApp Service Request System

**Automated bike service request management with WhatsApp integration**

---

## 📋 Overview

CycleBees is a Next.js application that streamlines bike service requests by automatically sending WhatsApp messages to customers with order details and tracking.

### Key Features

- ✅ **Automated WhatsApp Messaging** - Sends order details via n8n workflow
- ✅ **Pending Status System** - Tracks delivery confirmation
- ✅ **Error Handling** - Detects invalid numbers, network issues
- ✅ **Admin Dashboard** - Create requests, view status, filter by state
- ✅ **Customer Portal** - View order details, select services

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- n8n instance with WhatsApp Business API configured

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Tech Stack

- **Framework:** Next.js 15.5.2 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form + Zod validation
- **Automation:** n8n workflows
- **Messaging:** WhatsApp Business API

---

## 📁 Project Structure

```
/
├── app/
│   ├── admin/              # Admin dashboard & request creation
│   ├── o/[slug]/           # Customer portal
│   └── api/
│       ├── requests/       # CRUD operations
│       └── webhooks/       # n8n integration
├── components/ui/          # Reusable UI components
├── lib/
│   ├── supabase.ts         # Database client & types
│   ├── validations.ts      # Zod schemas
│   └── utils.ts            # Helper functions
└── database/
    ├── schema.sql          # Complete database schema
    └── migrations/         # Database migrations
```

---

## 🔧 Configuration

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# n8n Webhook
N8N_WEBHOOK_URL=your-n8n-webhook-url

# App URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Database Setup

Run the schema and migration:
```sql
-- 1. Run database/schema.sql in Supabase SQL Editor
-- 2. Run database/migrations/001_add_pending_status.sql
```

### n8n Configuration

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#4-n8n-configuration) for complete setup.

**Critical:** Enable "Continue On Fail" in WhatsApp node!

---

## 📚 Documentation

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing procedures

---

## 🧪 Testing

```bash
# Run development server
npm run dev

# Run tests (see TESTING_GUIDE.md)
# 1. Test valid WhatsApp number
# 2. Test invalid number
# 3. Test phone validation
# 4. Test confirmation modal
# 5. Test dashboard filters
```

---

## 🚢 Deployment

### Production Deployment (Vercel)

1. Run migration on production Supabase
2. Configure environment variables in Vercel
3. Deploy:
```bash
git push origin main
# Vercel auto-deploys
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#6-deployment-steps) for detailed steps.

---

## 📊 Database Schema

### Main Tables

- **requests** - Service requests with WhatsApp tracking
- **request_items** - Repair/replacement items
- **addons** - Additional services
- **service_bundles** - Service packages

### Key Fields (requests table)

- `status` - 'pending' | 'sent' | 'viewed' | 'confirmed' | 'cancelled'
- `whatsapp_message_id` - WhatsApp message tracking ID
- `whatsapp_sent_at` - When WhatsApp was sent
- `whatsapp_error` - Error message if send failed

---

## 🔄 Request Flow

```
1. Admin creates request
   ↓
2. Saved to database (status='pending')
   ↓
3. n8n webhook called (30s timeout)
   ↓
4a. SUCCESS: Status → 'sent', save message_id
4b. FAILURE: Status → 'pending', save error
```

---

## 🛡️ Robustness Features

- ✅ 30-second webhook timeout
- ✅ 3-attempt retry logic with exponential backoff
- ✅ Message validation (empty/length checks)
- ✅ Phone validation (exactly 10 digits)
- ✅ Browser warning before close during operation
- ✅ Comprehensive error detection

---

## 🐛 Troubleshooting

### All requests stuck as 'pending'

Check:
1. N8N_WEBHOOK_URL is correct
2. n8n workflow is activated
3. "Continue On Fail" is enabled

### Valid numbers marked 'pending'

Check n8n execution logs for errors

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#9-troubleshooting) for more.

---

## 📝 License

Proprietary - CycleBees

---

## 🤝 Support

For issues or questions, contact: [your-contact]

---

**Built with ❤️ for efficient bike service management**
