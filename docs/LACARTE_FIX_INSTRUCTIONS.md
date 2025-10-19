# La-Carte Pricing Fix - Implementation Guide

**Issue Date**: 2025-10-19 **Status**: Ready to Apply **Impact**: Dashboard
totals, Analytics, CSV exports

---

## Problem Summary

The dashboard displays incorrect totals for new/pending service requests because
the database trigger `update_request_totals()` only counts `request_items` and
**ignores the `lacarte_paise` value**.

### Verification Results

✅ **Issue Confirmed** via test script (`scripts/test-trigger.ts`):

- Created test request with items (₹250) + la-carte (₹99)
- Expected total: ₹349
- Actual stored: ₹250 ❌
- **Missing: ₹99 (la-carte not included)**

### Impact Analysis

| Component         | Affected? | Details                                          |
| ----------------- | --------- | ------------------------------------------------ |
| Dashboard table   | ❌ YES    | Shows wrong totals for pending/sent orders       |
| Analytics revenue | ❌ YES    | Uses `total_paise` directly (line 33, 181, 210)  |
| CSV exports       | ❌ YES    | Exports `total_paise` from database              |
| Confirmed orders  | ✅ NO     | API correctly updates totals with addons/bundles |
| Customer view     | ✅ NO     | API recalculates on view/confirm                 |

---

## Solution: Database Migration

**File**: `db/migrations/002_fix_lacarte_in_totals.sql`

### What It Does

1. **Updates the trigger** to include `lacarte_paise` in `total_paise`
   calculation
2. **Backfills** existing pending/sent orders with correct totals
3. **Skips** confirmed orders (they have complex totals with addons/bundles)

---

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Open [Supabase Dashboard](https://zhsiykictemrbkmbzkye.supabase.co)
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy contents of `db/migrations/002_fix_lacarte_in_totals.sql`
5. Paste and **Run** the SQL
6. Verify with the test script (see below)

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI set up
supabase db push --file db/migrations/002_fix_lacarte_in_totals.sql
```

---

## Verification Steps

### 1. Before Applying Migration

Run the check script to see current state:

```bash
npx tsx scripts/apply-lacarte-fix.ts
```

Expected output:

- Shows requests with la-carte
- Indicates which ones need fixing

### 2. Apply Migration

Copy and run the SQL in Supabase Dashboard (see above)

### 3. After Migration - Test Trigger

```bash
npx tsx scripts/test-trigger.ts
```

Expected output:

```
✅ SUCCESS: Database trigger correctly includes la-carte
   Expected total:   ₹349.00 (34900 paise)
   Actual total:     ₹349.00 (34900 paise)
```

### 4. Verify Existing Data

```bash
npx tsx scripts/verify-database-schema.ts
```

All requests should show:

```
✅ CORRECT
```

---

## Rollback Instructions

If something goes wrong, run the rollback migration:

**File**: `db/migrations/002_rollback_lacarte_fix.sql`

This will restore the original trigger (without la-carte calculation).

⚠️ **Note**: Rollback does NOT restore old `total_paise` values. If you need to
restore data, you must have a backup.

---

## Technical Details

### Old Trigger (Broken)

```sql
SELECT COALESCE(SUM(price_paise), 0) as total
FROM request_items
WHERE request_id = ...;

UPDATE requests
SET total_paise = request_total  -- ❌ Missing la-carte!
```

### New Trigger (Fixed)

```sql
-- Get items total
SELECT COALESCE(SUM(price_paise), 0) INTO request_total
FROM request_items WHERE request_id = ...;

-- Get la-carte price for THIS request
SELECT COALESCE(lacarte_paise, 0) INTO la_carte_price
FROM requests WHERE id = ...;

-- Include la-carte in total
UPDATE requests
SET total_paise = request_total + la_carte_price  -- ✅ Fixed!
```

---

## Analytics Fix

The analytics API (`app/api/analytics/route.ts`) uses `total_paise` directly:

- **Line 33**: Total revenue calculation
- **Line 181**: Revenue by period
- **Line 210**: Daily trends

Once the migration is applied, analytics will automatically show correct totals
for all new requests.

**Existing data**: Only pending/sent orders will be backfilled. Confirmed orders
are left as-is (they have complex totals).

---

## FAQ

### Q: Will this affect confirmed orders?

**A**: No. Confirmed orders are **not touched** by the backfill. The trigger fix
only affects NEW requests going forward. Confirmed orders already have correct
totals (calculated by the API with addons/bundles).

### Q: What about orders in "viewed" status?

**A**: Viewed orders may or may not be correct depending on whether the customer
viewed with selections. The backfill only touches pending/sent. You can manually
review viewed orders if needed.

### Q: Do I need to restart the application?

**A**: No. This is a database-only change. No application restart required.

### Q: What if la-carte pricing changes in the future?

**A**: Each request stores its own `lacarte_paise` value. Changing global
settings won't affect existing requests.

---

## Support

If you encounter issues:

1. Check verification scripts output
2. Review Supabase logs in Dashboard
3. Run rollback if necessary
4. Contact support with error messages

---

## Checklist

- [ ] Backup database (optional but recommended)
- [ ] Run `npx tsx scripts/apply-lacarte-fix.ts` to see what will change
- [ ] Apply migration in Supabase SQL Editor
- [ ] Run `npx tsx scripts/test-trigger.ts` to verify trigger works
- [ ] Run `npx tsx scripts/verify-database-schema.ts` to check data
- [ ] Test dashboard - create a new request and verify total includes la-carte
- [ ] Check analytics page - verify revenue numbers look reasonable
- [ ] Mark this checklist complete ✅

---

**Migration Created**: 2025-10-19 **Last Updated**: 2025-10-19 **Status**: ✅
Ready to Deploy
