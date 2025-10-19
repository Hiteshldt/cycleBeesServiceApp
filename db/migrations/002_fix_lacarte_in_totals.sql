-- Migration: Fix total calculation to include la-carte pricing
-- Date: 2025-10-19
-- Purpose: Update the trigger to include lacarte_paise in total_paise calculation
-- Issue: Dashboard shows incorrect totals for non-confirmed orders (missing la-carte)

-- Step 1: Update the trigger function to include la-carte in calculation
CREATE OR REPLACE FUNCTION update_request_totals()
RETURNS TRIGGER AS $$
DECLARE
    request_total INTEGER;
    la_carte_price INTEGER;
    target_request_id UUID;
BEGIN
    -- Get the request ID from either NEW or OLD
    target_request_id := COALESCE(NEW.request_id, OLD.request_id);

    -- Calculate total for the request items (GST inclusive)
    SELECT COALESCE(SUM(price_paise), 0)
    INTO request_total
    FROM request_items
    WHERE request_id = target_request_id;

    -- Get la-carte price for this specific request
    -- Use request-specific price if set, otherwise default to 0
    -- (Global la-carte settings are handled at application layer)
    SELECT COALESCE(lacarte_paise, 0)
    INTO la_carte_price
    FROM requests
    WHERE id = target_request_id;

    -- Update the request totals (all prices are GST inclusive)
    UPDATE requests
    SET
        subtotal_paise = request_total,
        tax_paise = 0,
        total_paise = request_total + la_carte_price
    WHERE id = target_request_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 2: Backfill existing requests with incorrect totals
-- IMPORTANT: Only update pending/sent requests (not confirmed)
-- Confirmed requests may have addons/bundles, so their totals are complex
-- and should not be recalculated here
UPDATE requests r
SET total_paise = r.subtotal_paise + COALESCE(r.lacarte_paise, 0)
WHERE
    r.status IN ('pending', 'sent')  -- Only non-confirmed orders
    AND r.lacarte_paise IS NOT NULL
    AND r.lacarte_paise > 0
    AND r.total_paise != (r.subtotal_paise + r.lacarte_paise);

-- Step 3: Verification query (optional - comment out for production)
-- This shows before/after comparison for requests that were updated
SELECT
    order_id,
    status,
    subtotal_paise,
    lacarte_paise,
    total_paise as current_total,
    (subtotal_paise + COALESCE(lacarte_paise, 0)) as expected_total,
    CASE
        WHEN total_paise = (subtotal_paise + COALESCE(lacarte_paise, 0))
        THEN 'CORRECT'
        ELSE 'NEEDS_FIX'
    END as status_check
FROM requests
WHERE lacarte_paise IS NOT NULL AND lacarte_paise > 0
ORDER BY created_at DESC
LIMIT 10;
