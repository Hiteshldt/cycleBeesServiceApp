# Copy Only Data from Production to Test

## Run these in PRODUCTION Supabase, copy output, run in TEST Supabase

### Step 1: Export Addons Data
```sql
SELECT string_agg(
  format(
    'INSERT INTO addons VALUES (%L, %L, %L, %L, %L, %L, %L);',
    id, name, description, price_paise, is_active, display_order, created_at
  ),
  E'\n'
)
FROM addons;
```

### Step 2: Export Service Bundles  
```sql
SELECT string_agg(
  format(
    'INSERT INTO service_bundles VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L);',
    id, name, description, price_paise, bullet_points, is_active, display_order, created_at, updated_at
  ),
  E'\n'
)
FROM service_bundles;
```

### Step 3: Export La Carte Settings
```sql
SELECT string_agg(
  format(
    'INSERT INTO lacarte_settings VALUES (%L, %L, %L, %L, %L);',
    id, price_paise, is_active, created_at, updated_at
  ),
  E'\n'
)
FROM lacarte_settings;
```

### Step 4: Export Admin Credentials
```sql  
SELECT string_agg(
  format(
    'INSERT INTO admin_credentials VALUES (%L, %L, %L, %L, %L);',
    id, username, password, is_active, created_at
  ),
  E'\n'
)
FROM admin_credentials;
```

### Step 5: Export Sample Requests (last 10)
```sql
SELECT string_agg(
  format(
    'INSERT INTO requests VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L);',
    id, short_slug, order_id, bike_name, customer_name, phone_digits_intl, 
    status, subtotal_paise, tax_paise, total_paise, created_at, sent_at
  ),
  E'\n'
)
FROM (SELECT * FROM requests ORDER BY created_at DESC LIMIT 10) r;
```

### Step 6: Export Request Items for those requests
```sql
SELECT string_agg(
  format(
    'INSERT INTO request_items VALUES (%L, %L, %L, %L, %L, %L, %L);',
    id, request_id, section, label, price_paise, is_suggested, created_at
  ),
  E'\n'
)
FROM request_items
WHERE request_id IN (SELECT id FROM requests ORDER BY created_at DESC LIMIT 10);
```

## How to Use:
1. Run each query in PRODUCTION
2. Copy the output
3. Paste and run in TEST
4. Done!
