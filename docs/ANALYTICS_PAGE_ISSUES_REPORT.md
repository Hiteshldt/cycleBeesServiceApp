# Analytics Page - Issues & Analysis Report

**Date**: 2025-10-19 **Status**: Analysis Complete **Test Data**: 1 confirmed
order in database

---

## 📊 Current State

### Database Status

- **Total Requests**: 1 (Sep-Oct 2025)
- **Confirmed Orders**: 1 (100% confirmation rate)
- **Active Addons**: 4
- **Confirmed Addon Selections**: 1
- **Service Items**: 3 total

### Current Metrics

- **Total Revenue**: ₹898 (correct)
- **Average Order Value**: ₹898
- **Confirmation Rate**: 100%

---

## 🔍 Issues Identified

### 1. ⚠️ **CRITICAL: Mock Data in Addon Performance** (Line 120-124)

**Location**: `app/api/analytics/route.ts:120-124`

**Current Code**:

```typescript
// For now, generate mock addon performance data
const addonsPerformance = (addons || []).map((addon) => ({
  name: addon.name,
  adoptionRate: Math.random() * 30 + 5, // ❌ FAKE DATA
  revenue: Math.round((addon.price_paise || 0) * (Math.random() * 10 + 2)), // ❌ FAKE DATA
}))
```

**Problem**:

- Addon performance shows **completely random/fake data**
- Adoption rates are randomly generated (5-35%)
- Revenue is randomly calculated
- **This is misleading for business decisions!**

**Impact**: HIGH

- Admin sees fake performance metrics
- Cannot trust addon analysis
- Business decisions based on wrong data

**Status**: ❌ ACTIVE ISSUE

---

### 2. ⚠️ **La-Carte Missing from Total (FIXED but needs migration)**

**Location**: Database trigger `update_request_totals()`

**Problem**:

- New/pending requests don't include la-carte in `total_paise`
- Analytics uses `total_paise` directly (lines 33, 181, 210)
- Revenue calculations are understated for non-confirmed orders

**Impact**: MEDIUM (affects pending/sent orders only)

**Status**: ✅ FIX READY (migration file created:
`db/migrations/002_fix_lacarte_in_totals.sql`)

**Action Required**: Apply database migration

---

### 3. ℹ️ **Limited Sample Data**

**Current State**:

- Only 1 request in database
- All charts/graphs show minimal data
- Hard to visualize trends with 1 data point

**Impact**: LOW (expected in test environment)

**Status**: ℹ️ INFORMATIONAL

---

### 4. ⚠️ **UI/UX Issues**

#### a) Revenue Trend Chart Labels Overlap

**Location**: `app/admin/analytics/page.tsx:376`

**Problem**:

- Date labels rotate 45 degrees
- When many data points, labels overlap
- Hard to read period names

**Impact**: LOW **Visual**: Text readability issue with 60+ day ranges

#### b) No Real-Time Addon Performance

**Location**: `app/api/analytics/route.ts:113-124`

**Problem**:

- System has `confirmed_order_addons` table with real data
- API ignores it and uses random numbers instead
- Comment says "mock data since addons might not be fully implemented"
- **But addons ARE implemented!**

**Impact**: HIGH

---

### 5. ⚠️ **Missing Features**

#### a) No Filter by Status

- Can't filter revenue by order status (confirmed only vs all)
- Total revenue includes pending/cancelled orders

#### b) No Addon Adoption Calculation

- Real addon selections exist in database
- Not being calculated or displayed

#### c) No Bundle Analytics

- Bundles exist in system
- No analytics for bundle performance
- No revenue breakdown by bundles

---

## 🎯 Recommended Fixes

### Priority 1: Fix Addon Performance (HIGH PRIORITY)

**Replace mock data with real calculations**:

```typescript
// Get real addon performance
const { data: confirmedAddonsList } = await supabase
  .from('confirmed_order_addons')
  .select(
    `
    addon_id,
    addons (
      id,
      name,
      price_paise
    ),
    requests!inner (
      created_at,
      status
    )
  `
  )
  .gte('requests.created_at', `${startDate}T00:00:00.000Z`)
  .lte('requests.created_at', `${endDate}T23:59:59.999Z`)

const addonStats: Record<string, { count: number; revenue: number }> = {}

confirmedAddonsList?.forEach((item: any) => {
  const addonId = item.addon_id
  if (!addonStats[addonId]) {
    addonStats[addonId] = {
      count: 0,
      revenue: 0,
    }
  }
  addonStats[addonId].count++
  addonStats[addonId].revenue += item.addons?.price_paise || 0
})

const addonsPerformance = (addons || []).map((addon) => {
  const stats = addonStats[addon.id] || { count: 0, revenue: 0 }
  const adoptionRate = totalOrders > 0 ? (stats.count / totalOrders) * 100 : 0

  return {
    name: addon.name,
    adoptionRate,
    revenue: stats.revenue,
  }
})
```

**Benefits**:

- Real adoption rates
- Accurate revenue per addon
- Trustworthy business insights

---

### Priority 2: Add Bundle Analytics (MEDIUM PRIORITY)

**Add bundle performance tracking similar to addons**:

```typescript
// Fetch bundle performance
const { data: confirmedBundlesList } = await supabase
  .from('confirmed_order_bundles')
  .select(`
    bundle_id,
    service_bundles (
      id,
      name,
      price_paise
    ),
    requests!inner (
      created_at
    )
  `)
  .gte('requests.created_at', `${startDate}T00:00:00.000Z`)
  .lte('requests.created_at', `${endDate}T23:59:59.999Z`)

// Calculate bundle stats...
const bundlesPerformance = // similar to addons
```

---

### Priority 3: Apply La-Carte Migration (HIGH PRIORITY)

**Action**: Run the migration file **File**:
`db/migrations/002_fix_lacarte_in_totals.sql` **Impact**: Fixes revenue
calculations for pending/sent orders

---

### Priority 4: Improve UI (LOW PRIORITY)

1. **Better chart labels**: Reduce rotation, use shortened dates
2. **Add tooltips**: Show exact values on hover
3. **Add status filter**: Allow filtering by confirmed orders only
4. **Empty state**: Better messaging when no data

---

## 📝 Code Locations Reference

| Issue                    | File                           | Lines        |
| ------------------------ | ------------------------------ | ------------ |
| Mock addon data          | `app/api/analytics/route.ts`   | 113-124      |
| La-carte in revenue      | `app/api/analytics/route.ts`   | 33, 181, 210 |
| Chart labels             | `app/admin/analytics/page.tsx` | 376-379      |
| Top services calculation | `app/api/analytics/route.ts`   | 73-93        |
| Revenue by period        | `app/api/analytics/route.ts`   | 155-192      |

---

## ✅ What's Working Well

1. ✅ **Total Revenue Calculation**: Accurate for confirmed orders
2. ✅ **Confirmation Rate**: Correctly calculated
3. ✅ **Order Status Distribution**: Accurate
4. ✅ **Top Services**: Real data from request_items
5. ✅ **Date Range Filter**: Works correctly
6. ✅ **Quick Range Buttons**: 7/30/90 days shortcuts work
7. ✅ **Loading States**: Good UX with skeleton loaders
8. ✅ **Empty States**: Proper handling of no data

---

## 🎬 Next Steps

### Immediate Action Required

1. **Fix Addon Performance** (30 min)
   - Replace mock data with real calculations
   - Test with existing data
   - Deploy fix

2. **Apply La-Carte Migration** (5 min)
   - Run SQL in Supabase dashboard
   - Verify with test script

### Future Enhancements

3. **Add Bundle Analytics** (1 hour)
4. **Improve Chart UI** (2 hours)
5. **Add More Filters** (1 hour)
   - Status filter
   - Date presets
   - Export to CSV

---

## 🧪 Testing Commands

```bash
# Test analytics calculations
npx tsx scripts/test-analytics.ts

# Verify la-carte migration (after applying)
npx tsx scripts/test-trigger.ts
```

---

**Report Generated**: 2025-10-19 **Tested With**: 1 confirmed order, 4 addons, 3
service items **Status**: ✅ Analysis Complete, Issues Identified, Fixes Ready
