-- Rollback Migration: Revert la-carte fix in total calculation
-- Date: 2025-10-19
-- Purpose: Restore original trigger that only counts request_items

-- Restore original trigger function (without la-carte)
CREATE OR REPLACE FUNCTION update_request_totals()
RETURNS TRIGGER AS $$
DECLARE
    request_total INTEGER;
BEGIN
    -- Calculate total for the request (GST inclusive)
    SELECT
        COALESCE(SUM(price_paise), 0) as total
    INTO request_total
    FROM request_items
    WHERE request_id = COALESCE(NEW.request_id, OLD.request_id);

    -- Update the request totals (all prices are GST inclusive)
    UPDATE requests
    SET
        subtotal_paise = request_total,
        tax_paise = 0,
        total_paise = request_total
    WHERE id = COALESCE(NEW.request_id, OLD.request_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Note: This rollback does NOT restore the old total_paise values
-- If you need to restore them, you'll need a backup
