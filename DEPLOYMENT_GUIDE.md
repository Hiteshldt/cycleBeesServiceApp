# 🚀 DEPLOYMENT GUIDE - WhatsApp Automation System

**Status:** Production Ready ✅
**Version:** 1.0

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Architecture & Flow](#2-architecture--flow)
3. [Database Setup](#3-database-setup)
4. [n8n Configuration](#4-n8n-configuration)
5. [Environment Variables](#5-environment-variables)
6. [Deployment Steps](#6-deployment-steps)
7. [Rollback Procedure](#7-rollback-procedure)
8. [Monitoring](#8-monitoring)

---

## 1. SYSTEM OVERVIEW

### What This System Does

- ✅ Admin creates request → Auto-sends WhatsApp via n8n
- ✅ Valid numbers: Status = 'sent', message ID saved
- ✅ Invalid numbers: Status = 'pending', error saved
- ✅ 30-second timeout, 3-attempt retry, phone validation

### Key Features

- **Pending Status** - Requests pending until WhatsApp confirms
- **Error Detection** - Invalid numbers, rate limits, network issues
- **Retry Logic** - 3 attempts with exponential backoff
- **Timeout Protection** - 30s max
- **User Protection** - Browser warning before close

---

## 2. ARCHITECTURE & FLOW

```
Admin Creates Request
  → Save (status='pending')
  → Call n8n (30s timeout)
  → SUCCESS: Update to 'sent' + message_id
  → FAILURE: Keep 'pending' + error
```

---

## 3. DATABASE SETUP

### Migration Script

Run in Supabase SQL Editor:

```sql
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS whatsapp_error TEXT;

ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE requests ADD CONSTRAINT requests_status_check
    CHECK (status IN ('pending', 'sent', 'viewed', 'confirmed', 'cancelled'));

ALTER TABLE requests ALTER COLUMN status SET DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_requests_pending ON requests(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_requests_whatsapp_sent ON requests(whatsapp_sent_at) WHERE whatsapp_sent_at IS NOT NULL;
```

---

## 4. N8N CONFIGURATION

### ⚠️ CRITICAL: Must Enable "Continue On Fail"

**WhatsApp Business Cloud Node:**
- Settings → Options → Continue On Fail: **ENABLED** ✅

Without this, errors won't be detected properly!

### Workflow Structure

```
Webhook Trigger (POST)
  ↓
WhatsApp Business Cloud (Continue On Fail: ON)
  ↓
Respond to Webhook (First Incoming Item)
```

### Test n8n

Execute with test data:
```json
{
  "phone": "+919999999999",
  "message": "Test",
  "customerName": "Test",
  "bikeName": "Bike",
  "orderId": "TEST001",
  "orderUrl": "http://test.com"
}
```

Check: Respond to Webhook shows error for invalid number

---

## 5. ENVIRONMENT VARIABLES

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
N8N_WEBHOOK_URL=https://your-n8n.cloud/webhook/send-whatsapp
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

---

## 6. DEPLOYMENT STEPS

1. **Run migration** in Supabase SQL Editor
2. **Update environment** variables (N8N_WEBHOOK_URL)
3. **Deploy code** (`git push`)
4. **Test with real number** - Should receive message
5. **Test with fake number** - Should stay pending
6. **Monitor 24 hours**

---

## 7. ROLLBACK PROCEDURE

If needed, run in Supabase:

```sql
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE requests ADD CONSTRAINT requests_status_check
    CHECK (status IN ('sent', 'viewed', 'confirmed', 'cancelled'));

ALTER TABLE requests
DROP COLUMN IF EXISTS whatsapp_message_id,
DROP COLUMN IF EXISTS whatsapp_sent_at,
DROP COLUMN IF EXISTS whatsapp_error;

ALTER TABLE requests ALTER COLUMN status SET DEFAULT 'sent';
DROP INDEX IF EXISTS idx_requests_pending;
DROP INDEX IF EXISTS idx_requests_whatsapp_sent;
```

---

## 8. MONITORING

```sql
-- Success rate (last 24h)
SELECT
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'sent') / COUNT(*), 2) as success_rate
FROM requests
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Common errors
SELECT whatsapp_error, COUNT(*)
FROM requests
WHERE status = 'pending' AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY whatsapp_error;
```

---

## 🎯 CHECKLIST

- [ ] Migration tested
- [ ] n8n "Continue On Fail" enabled
- [ ] Environment variables set
- [ ] Code deployed
- [ ] Test: Real number (success)
- [ ] Test: Fake number (pending)
- [ ] Monitor 24 hours

**Ready to deploy!** 🚀
