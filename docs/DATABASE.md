# CycleBees Services - Database Schema Documentation

**Database**: PostgreSQL (via Supabase) **Version**: 1.0.0 **Last Updated**:
2025-10-19

---

## Table of Contents

1. [Overview](#overview)
2. [Database Tables](#database-tables)
3. [Relationships](#relationships)
4. [Triggers & Functions](#triggers--functions)
5. [Indexes](#indexes)
6. [Migrations](#migrations)
7. [Missing Tables](#missing-tables)
8. [Data Types & Conventions](#data-types--conventions)

---

## Overview

The CycleBees Services database is a PostgreSQL database hosted on Supabase. It
manages:

- **Service Requests**: Customer bike service estimates
- **Line Items**: Repair and replacement services for each request
- **Add-ons**: Optional add-on services (wash, detailing, etc.)
- **Admin Authentication**: Simple username/password authentication
- **Customer Selections**: Confirmed orders with selected services and add-ons

**Key Features**:

- Auto-generated unique short slugs for customer-facing URLs
- Auto-calculated totals via database triggers
- Cascade deletes for referential integrity
- Timestamps for audit trails

**Schema File**: `db/schema.sql:1`

---

## Database Tables

### 1. `requests`

**Description**: Main table for service requests (estimates)

**Primary Use**: Store bike service requests created by admin, sent to customers
via WhatsApp

| Column              | Type                     | Constraints                             | Description                                                            |
| ------------------- | ------------------------ | --------------------------------------- | ---------------------------------------------------------------------- |
| `id`                | UUID                     | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique request identifier                                              |
| `short_slug`        | VARCHAR(20)              | UNIQUE, NOT NULL                        | Customer-facing URL slug (e.g., `ABC12XYZ`)                            |
| `order_id`          | VARCHAR(100)             | NOT NULL                                | Human-readable order ID (e.g., `ORD-001`)                              |
| `bike_name`         | VARCHAR(200)             | NOT NULL                                | Bike model/name (e.g., `Royal Enfield Classic 350`)                    |
| `customer_name`     | VARCHAR(200)             | NOT NULL                                | Customer's full name                                                   |
| `phone_digits_intl` | VARCHAR(20)              | NOT NULL                                | Phone number in international format (e.g., `919876543210`)            |
| `status`            | VARCHAR(20)              | DEFAULT 'sent', CHECK constraint        | Request status: `pending`, `sent`, `viewed`, `confirmed`, `cancelled`  |
| `lacarte_paise`     | INTEGER                  | NULLABLE                                | La Carte (base service) price in paise                                 |
| `subtotal_paise`    | INTEGER                  | DEFAULT 0                               | Subtotal of all items (auto-calculated)                                |
| `tax_paise`         | INTEGER                  | DEFAULT 0                               | Tax amount in paise (currently 0, prices are GST-inclusive)            |
| `total_paise`       | INTEGER                  | DEFAULT 0                               | Total price (auto-calculated via trigger)                              |
| `whatsapp_sent_at`  | TIMESTAMP WITH TIME ZONE | NULLABLE                                | Timestamp when WhatsApp message was sent                               |
| `created_at`        | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                           | Request creation timestamp                                             |
| `updated_at`        | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                           | Last update timestamp                                                  |
| `sent_at`           | TIMESTAMP WITH TIME ZONE | NULLABLE                                | **Deprecated**: When request was sent (use `whatsapp_sent_at` instead) |

**Indexes**:

- `idx_requests_short_slug` on `short_slug` (for fast customer lookups)
- `idx_requests_status` on `status` (for filtering by status)
- `idx_requests_created_at` on `created_at DESC` (for sorting recent requests)

**Triggers**:

- `trigger_set_short_slug` (BEFORE INSERT): Auto-generates `short_slug` if not
  provided

**Status Values**:

- `pending`: Draft request, not yet sent to customer
- `sent`: WhatsApp message sent to customer
- `viewed`: Customer viewed the estimate
- `confirmed`: Customer confirmed the order
- `cancelled`: Request cancelled

**Pricing Convention**: All prices stored in paise (1 rupee = 100 paise)

**Source**: `db/schema.sql:5`

---

### 2. `request_items`

**Description**: Line items for each service request (repair/replacement
services)

**Primary Use**: Store individual services in a request (e.g., "Engine oil
change - ₹150")

| Column         | Type                     | Constraints                                   | Description                                     |
| -------------- | ------------------------ | --------------------------------------------- | ----------------------------------------------- |
| `id`           | UUID                     | PRIMARY KEY, DEFAULT uuid_generate_v4()       | Unique item identifier                          |
| `request_id`   | UUID                     | FOREIGN KEY → requests(id), ON DELETE CASCADE | Parent request                                  |
| `section`      | VARCHAR(20)              | NOT NULL, CHECK constraint                    | Item category: `repair` or `replacement`        |
| `label`        | VARCHAR(500)             | NOT NULL                                      | Service description (e.g., `Engine oil change`) |
| `price_paise`  | INTEGER                  | NOT NULL, CHECK (price_paise > 0)             | Service price in paise                          |
| `is_suggested` | BOOLEAN                  | DEFAULT true                                  | Whether admin suggested this service            |
| `created_at`   | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                                 | Item creation timestamp                         |

**Indexes**:

- `idx_request_items_request_id` on `request_id` (for fast item lookups by
  request)

**Triggers**:

- `trigger_update_totals_insert` (AFTER INSERT): Recalculates request totals
- `trigger_update_totals_update` (AFTER UPDATE): Recalculates request totals
- `trigger_update_totals_delete` (AFTER DELETE): Recalculates request totals

**Section Values**:

- `repair`: Repair services (e.g., oil change, brake adjustment)
- `replacement`: Replacement parts (e.g., air filter, spark plug)

**Cascade Behavior**: When a request is deleted, all its items are automatically
deleted

**Source**: `db/schema.sql:21`

---

### 3. `admin_credentials`

**Description**: Admin user credentials for authentication

**Primary Use**: Store admin username and hashed password for login

| Column       | Type                     | Constraints                             | Description                     |
| ------------ | ------------------------ | --------------------------------------- | ------------------------------- |
| `id`         | UUID                     | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique admin identifier         |
| `username`   | VARCHAR(50)              | NOT NULL, UNIQUE                        | Admin username (e.g., `admin`)  |
| `password`   | VARCHAR(255)             | NOT NULL                                | Bcrypt-hashed password          |
| `is_active`  | BOOLEAN                  | DEFAULT true                            | Whether admin account is active |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                           | Account creation timestamp      |

**Default Credentials** (⚠️ **CHANGE IN PRODUCTION**):

- Username: `admin`
- Password: `cyclebees123` (plain text in schema, should be hashed with
  `scripts/admin/hash-passwords.ts`)

**Security Notes**:

- Passwords are hashed using bcrypt (via `lib/auth.ts:hashPassword()`)
- JWT tokens issued upon successful login (via `lib/auth.ts:generateToken()`)
- Middleware protects all `/admin/*` routes (see `middleware.ts:1`)

**Source**: `db/schema.sql:32`

---

### 4. `addons`

**Description**: Optional add-on services (wash, detailing, etc.)

**Primary Use**: Catalog of additional services customers can add to their order

| Column          | Type                     | Constraints                             | Description                                     |
| --------------- | ------------------------ | --------------------------------------- | ----------------------------------------------- |
| `id`            | UUID                     | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique addon identifier                         |
| `name`          | VARCHAR(200)             | NOT NULL                                | Addon name (e.g., `Premium Bike Wash & Polish`) |
| `description`   | TEXT                     | NULLABLE                                | Detailed description of addon                   |
| `price_paise`   | INTEGER                  | NOT NULL, CHECK (price_paise > 0)       | Addon price in paise                            |
| `is_active`     | BOOLEAN                  | DEFAULT true                            | Whether addon is available for selection        |
| `display_order` | INTEGER                  | DEFAULT 0                               | Order in which addons are displayed (1 = first) |
| `created_at`    | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                           | Addon creation timestamp                        |
| `updated_at`    | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                           | Last update timestamp                           |

**Indexes**:

- `idx_addons_active_order` on `(is_active, display_order)` (for efficient
  sorted filtering)

**Default Addons** (8 pre-populated):

1. Premium Bike Wash & Polish - ₹200
2. Engine Deep Clean & Detailing - ₹300
3. Chain & Sprocket Complete Service - ₹120
4. Brake System Service - ₹150
5. Complete Fluid Service - ₹250
6. Tire Care Package - ₹80
7. Electrical System Check - ₹100
8. Performance Tuning - ₹350

**API Endpoints**:

- Admin: `GET/POST /api/admin/addons`
- Public: `GET /api/addons` (only active addons)

**Source**: `db/schema.sql:65`

---

### 5. `confirmed_order_services`

**Description**: Junction table tracking customer-selected service items

**Primary Use**: Store which service items the customer selected when confirming
order

| Column            | Type                     | Constraints                                        | Description                 |
| ----------------- | ------------------------ | -------------------------------------------------- | --------------------------- |
| `id`              | UUID                     | PRIMARY KEY, DEFAULT uuid_generate_v4()            | Unique selection identifier |
| `request_id`      | UUID                     | FOREIGN KEY → requests(id), ON DELETE CASCADE      | Parent request              |
| `service_item_id` | UUID                     | FOREIGN KEY → request_items(id), ON DELETE CASCADE | Selected service item       |
| `selected_at`     | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                                      | Selection timestamp         |

**Indexes**:

- `idx_confirmed_services_request_id` on `request_id`

**Cascade Behavior**: When a request or item is deleted, selections are
automatically deleted

**Usage**: When customer confirms order, frontend sends array of selected item
IDs. Backend inserts records into this table.

**Source**: `db/schema.sql:45`

---

### 6. `confirmed_order_addons`

**Description**: Junction table tracking customer-selected add-ons

**Primary Use**: Store which add-ons the customer selected when confirming order

| Column        | Type                     | Constraints                                   | Description                 |
| ------------- | ------------------------ | --------------------------------------------- | --------------------------- |
| `id`          | UUID                     | PRIMARY KEY, DEFAULT uuid_generate_v4()       | Unique selection identifier |
| `request_id`  | UUID                     | FOREIGN KEY → requests(id), ON DELETE CASCADE | Parent request              |
| `addon_id`    | UUID                     | FOREIGN KEY → addons(id), ON DELETE CASCADE   | Selected addon              |
| `selected_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                                 | Selection timestamp         |

**Indexes**:

- `idx_confirmed_addons_request_id` on `request_id`

**Cascade Behavior**: When a request or addon is deleted, selections are
automatically deleted

**Usage**: When customer confirms order, frontend sends array of selected addon
IDs. Backend inserts records into this table.

**Source**: `db/schema.sql:53`

---

## Relationships

### Entity Relationship Diagram (Textual)

```
requests (1) ──┬───< (many) request_items
               │
               ├───< (many) confirmed_order_services
               │                 │
               │                 └──> (1) request_items
               │
               └───< (many) confirmed_order_addons
                                 │
                                 └──> (1) addons

admin_credentials (independent table, no foreign keys)
```

### Relationship Details

1. **`requests` → `request_items`** (One-to-Many)
   - One request can have many service items
   - CASCADE DELETE: Deleting a request deletes all its items

2. **`requests` → `confirmed_order_services`** (One-to-Many)
   - One request can have many confirmed service selections
   - CASCADE DELETE: Deleting a request deletes all selections

3. **`request_items` → `confirmed_order_services`** (One-to-Many)
   - One item can be selected in multiple orders (unlikely in practice)
   - CASCADE DELETE: Deleting an item removes it from confirmed selections

4. **`requests` → `confirmed_order_addons`** (One-to-Many)
   - One request can have many confirmed addon selections
   - CASCADE DELETE: Deleting a request deletes all addon selections

5. **`addons` → `confirmed_order_addons`** (One-to-Many)
   - One addon can be selected in multiple orders
   - CASCADE DELETE: Deleting an addon removes it from confirmed selections

---

## Triggers & Functions

### 1. `generate_short_slug()` Function

**Description**: Generates a random 8-character alphanumeric slug for
customer-facing URLs

**Logic**:

1. Generate random 8-character string from charset `A-Z0-9`
2. Check if slug already exists in `requests.short_slug`
3. If exists, regenerate until unique slug is found
4. Return unique slug

**Example Output**: `ABC12XYZ`, `K8H3Q2M9`

**Called By**: `trigger_set_short_slug` trigger

**Source**: `db/schema.sql:96`

---

### 2. `set_short_slug()` Trigger Function

**Description**: Auto-generates `short_slug` if not provided when inserting a
request

**Trigger**: BEFORE INSERT on `requests`

**Logic**:

- If `NEW.short_slug` is NULL or empty string, call `generate_short_slug()` and
  assign to `NEW.short_slug`
- Otherwise, use provided slug (allows manual override)

**Source**: `db/schema.sql:120`

---

### 3. `update_request_totals()` Function

**Description**: Recalculates `subtotal_paise` and `total_paise` when request
items change

**Trigger**: AFTER INSERT/UPDATE/DELETE on `request_items`

**Logic**:

1. Sum all `price_paise` values for the request's items
2. Update parent request:
   - `subtotal_paise` = sum of items
   - `tax_paise` = 0 (prices are GST-inclusive)
   - `total_paise` = subtotal (same as subtotal since tax = 0)

**Example**:

- Request has 3 items: ₹150, ₹200, ₹50
- Trigger calculates: `subtotal_paise = 40000`, `total_paise = 40000`

**Source**: `db/schema.sql:136`

**Triggered By**:

- `trigger_update_totals_insert` (line 161)
- `trigger_update_totals_update` (line 166)
- `trigger_update_totals_delete` (line 171)

---

## Indexes

### Performance Indexes

| Index Name                          | Table                    | Columns                  | Purpose                                     |
| ----------------------------------- | ------------------------ | ------------------------ | ------------------------------------------- |
| `idx_requests_short_slug`           | requests                 | short_slug               | Fast customer order lookup by slug          |
| `idx_requests_status`               | requests                 | status                   | Filter requests by status (admin dashboard) |
| `idx_requests_created_at`           | requests                 | created_at DESC          | Sort requests by date (newest first)        |
| `idx_request_items_request_id`      | request_items            | request_id               | Fast item lookup for a request              |
| `idx_addons_active_order`           | addons                   | is_active, display_order | Efficient sorted filtering of active addons |
| `idx_confirmed_services_request_id` | confirmed_order_services | request_id               | Fast confirmed service lookup               |
| `idx_confirmed_addons_request_id`   | confirmed_order_addons   | request_id               | Fast confirmed addon lookup                 |

**Index Strategy**:

- Primary lookups: `short_slug`, `status`, `created_at`
- Foreign key relationships: All foreign keys have indexes
- Composite index on `addons` for combined filtering + sorting

**Source**: `db/schema.sql:88-94`, `61-62`

---

## Migrations

### Migration Files

Located in: `db/migrations/`

#### 1. `001_add_pending_status.sql`

**Description**: Add 'pending' status to requests table

**Purpose**: Support draft requests that haven't been sent to customers yet

**Changes**:

- Modifies `status` CHECK constraint to include `'pending'`
- Allows requests to be created and saved without sending WhatsApp message

**Migration Direction**: Forward (add feature)

**Source**: `db/migrations/001_add_pending_status.sql:1`

---

#### 2. `001_rollback_pending_status.sql`

**Description**: Rollback for `001_add_pending_status.sql`

**Purpose**: Remove 'pending' status if migration needs to be reverted

**Changes**:

- Reverts `status` CHECK constraint to original values (`sent`, `viewed`,
  `confirmed`, `cancelled`)

**Migration Direction**: Backward (rollback)

**Source**: `db/migrations/001_rollback_pending_status.sql:1`

---

### Migration Strategy

**Current Approach**: Manual SQL migrations in `db/migrations/` directory

**Recommended**:

- Use Supabase migrations (via Supabase CLI)
- Or implement programmatic migrations (e.g., with `node-pg-migrate`)
- Track migration history in database (add `migrations` table)

---

## Missing Tables

**⚠️ Warning**: The following tables are referenced in the codebase but **NOT**
present in `db/schema.sql`:

### 1. `service_bundles` (Missing)

**Referenced In**:

- `app/api/admin/bundles/route.ts:7`
- `app/api/admin/bundles/[id]/route.ts:10`
- `app/api/bundles/route.ts:1`

**Expected Schema** (inferred from API code):

```sql
CREATE TABLE service_bundles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price_paise INTEGER NOT NULL CHECK (price_paise > 0),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bundles_active_order ON service_bundles(is_active, display_order);
```

**Purpose**: Store service bundles (e.g., "Basic Service Package", "Premium
Service Package")

**Status**: **NEEDS TO BE ADDED** to `db/schema.sql`

---

### 2. `request_notes` (REMOVED - 2025-10-19)

**Status**: ❌ Removed from project

**Reason**:

- Table existed but was empty (0 rows)
- No UI components used this feature
- API endpoints were orphaned code
- Removed in migration `003_remove_request_notes.sql`

**Previously Referenced In** (removed):

- ~~`app/api/requests/[id]/notes/route.ts`~~ (deleted)
- ~~`app/api/requests/[id]/notes/[noteId]/route.ts`~~ (deleted)

**Schema** (for reference only):

```sql
CREATE TABLE request_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_request_notes_request_id ON request_notes(request_id);
```

**Purpose**: Store internal admin notes for service requests

**Status**: **NEEDS TO BE ADDED** to `db/schema.sql`

---

### 3. `lacarte_settings` (Missing)

**Referenced In**:

- `app/api/admin/lacarte/route.ts:1`

**Expected Schema** (inferred from API code):

```sql
CREATE TABLE lacarte_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    base_price_paise INTEGER NOT NULL CHECK (base_price_paise >= 0),
    discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only one settings row should exist (singleton pattern)
-- Consider adding unique constraint or CHECK to enforce single row
```

**Purpose**: Store La Carte (base service) pricing configuration

**Status**: **NEEDS TO BE ADDED** to `db/schema.sql`

---

### 4. `confirmed_order_bundles` (Likely Missing)

**Inferred From**: Pattern matching with `confirmed_order_addons` and
`confirmed_order_services`

**Expected Schema**:

```sql
CREATE TABLE confirmed_order_bundles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    bundle_id UUID REFERENCES service_bundles(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_confirmed_bundles_request_id ON confirmed_order_bundles(request_id);
```

**Purpose**: Track customer-selected bundles when confirming order

**Status**: **NEEDS TO BE ADDED** to `db/schema.sql` (if bundle selection
feature is used)

---

## Data Types & Conventions

### UUID Generation

**Extension**: `uuid-ossp`

**Function**: `uuid_generate_v4()`

**Usage**: All primary keys use UUIDs for globally unique identifiers

**Enabled At**: `db/schema.sql:2`

---

### Pricing Convention

**⚠️ IMPORTANT**: All prices are stored in **paise** (not rupees)

- 1 Rupee = 100 paise
- Example: ₹1,500.00 = 150000 paise

**Price Fields**:

- `price_paise` (request_items, addons, bundles)
- `lacarte_paise` (requests)
- `subtotal_paise` (requests)
- `tax_paise` (requests)
- `total_paise` (requests)

**Utility Functions**:

- `formatCurrency(paise)` in `lib/utils.ts:1` - Converts paise to formatted
  rupees (e.g., `₹1,500.00`)

**Rationale**: Avoid floating-point precision errors, ensure accurate
calculations

---

### Phone Number Format

**Field**: `phone_digits_intl`

**Format**: International digits without `+` prefix (e.g., `919876543210`)

**Validation**: 10-15 digits (see `lib/validations.ts:8`)

**Auto-Transform**: 10-digit Indian numbers get `91` prefix automatically

**Example**:

- Input: `9876543210` (10 digits)
- Stored: `919876543210` (12 digits with country code)

---

### Status Enumerations

#### Request Status

**Field**: `requests.status`

**Values**:

- `pending`: Draft, not sent
- `sent`: WhatsApp sent
- `viewed`: Customer viewed estimate
- `confirmed`: Customer confirmed order
- `cancelled`: Request cancelled

**Enforcement**: CHECK constraint in schema

---

#### Section Type

**Field**: `request_items.section`

**Values**:

- `repair`: Repair services
- `replacement`: Replacement parts

**Enforcement**: CHECK constraint in schema

---

### Timestamps

**Convention**: All timestamps use `TIMESTAMP WITH TIME ZONE` (TIMESTAMPTZ)

**Common Fields**:

- `created_at`: Record creation time (DEFAULT NOW())
- `updated_at`: Last update time (DEFAULT NOW(), manually updated in app code)
- `selected_at`: Selection time (for confirmed orders)
- `whatsapp_sent_at`: WhatsApp delivery time
- `sent_at`: **Deprecated** (use `whatsapp_sent_at`)

**Timezone**: UTC (Supabase default)

---

## Security Considerations

### Row Level Security (RLS)

**Status**: ❌ **NOT ENABLED**

**Risk**: Database exposed if Supabase keys leak

**Recommendation**: Enable RLS policies in Phase 6 (Security & Performance)

**Proposed Policies**:

```sql
-- Example RLS policy for requests (read-only for customers via slug)
CREATE POLICY "customers_can_read_own_requests"
ON requests FOR SELECT
USING (short_slug = current_setting('app.current_slug')::VARCHAR);

-- Example RLS policy for admin (full access with JWT)
CREATE POLICY "admins_have_full_access"
ON requests FOR ALL
USING (current_setting('app.is_admin')::BOOLEAN = true);
```

**See**: `docs/PROJECT_TRACKER.md` Phase 6, Tech Debt Item #1

---

### Password Security

**Current State**:

- Default admin password in `db/schema.sql` is **PLAIN TEXT**
- **⚠️ CRITICAL**: Must run `scripts/admin/hash-passwords.ts` before production

**Password Hashing**:

- Algorithm: bcrypt
- Rounds: 10 (default)
- Function: `lib/auth.ts:hashPassword()`

**Migration Script**: `scripts/admin/hash-passwords.ts:1`

---

### Sensitive Data

**Fields to Protect**:

- `admin_credentials.password` (hashed)
- `requests.phone_digits_intl` (PII)
- `requests.customer_name` (PII)

**Recommendations**:

- Never log phone numbers or customer names
- Implement field-level encryption for PII (future enhancement)
- Audit access logs (add to Phase 6)

---

## Database Backup & Recovery

**Supabase Backups**: Check Supabase dashboard for backup configuration

**Manual Backup**:

```bash
# Export schema
pg_dump -h db.xxx.supabase.co -U postgres -d postgres --schema-only > backup_schema.sql

# Export data
pg_dump -h db.xxx.supabase.co -U postgres -d postgres --data-only > backup_data.sql
```

**Restore**:

```bash
psql -h db.xxx.supabase.co -U postgres -d postgres < backup_schema.sql
psql -h db.xxx.supabase.co -U postgres -d postgres < backup_data.sql
```

**See**: `docs/DEPLOYMENT_GUIDE.md` for production backup strategy

---

## Performance Optimization

### Current Optimizations

1. **Indexes on Foreign Keys**: All foreign key columns have indexes
2. **Composite Indexes**: `addons(is_active, display_order)` for filtered
   sorting
3. **Cascade Deletes**: Reduce manual cleanup queries
4. **Auto-Calculated Totals**: Database triggers prevent calculation drift

### Future Optimizations

1. **Materialized Views**: For analytics (Phase 6)
2. **Partitioning**: If request volume exceeds 1M rows (future)
3. **Connection Pooling**: Already handled by Supabase
4. **Query Optimization**: Identify slow queries with `EXPLAIN ANALYZE`

---

## Additional Resources

- **API Documentation**: See `docs/API.md`
- **Schema File**: `db/schema.sql:1`
- **Migrations**: `db/migrations/`
- **Validation Schemas**: `lib/validations.ts:1`
- **Database Utilities**: `lib/supabase.ts:1`
- **Health Check Script**: `scripts/db/check-database.ts:1`

---

**Last Updated**: 2025-10-19 **Maintained By**: CycleBees Development Team
