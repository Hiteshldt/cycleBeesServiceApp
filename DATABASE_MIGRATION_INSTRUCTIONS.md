# 🗃️ CycleBees Database Migration Instructions

## 🚨 Current Database Status
Your Supabase database currently has only **2 tables** (`requests` and `request_items`) from an older version. The application requires **6 tables** plus functions, triggers, and default data to work properly.

## 🎯 What Needs To Be Done

### **Missing Components:**
- ❌ `admin_credentials` table - Admin authentication
- ❌ `addons` table - Add-on services management
- ❌ `confirmed_order_services` table - Customer service selections
- ❌ `confirmed_order_addons` table - Customer add-on selections
- ❌ Database functions - Auto-slug generation and total calculations
- ❌ Triggers - Automatic updates when data changes
- ❌ Indexes - Performance optimization
- ❌ Default data - Admin user and 8 add-on services
- ⚠️ Existing table columns may be missing or incomplete

## 🚀 Migration Steps

### **Step 1: Run the Migration Script**
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor** (in the left sidebar)
3. Create a new query
4. Copy the entire content of `database/supabase_migration.sql`
5. Paste it into the SQL Editor
6. Click **RUN** to execute the migration

### **Step 2: Verify Migration Success**
After running the script, you should see:

**Tables Created/Updated:**
```
✅ requests (updated with missing columns)
✅ request_items (updated with missing columns)
✅ admin_credentials (created)
✅ addons (created)
✅ confirmed_order_services (created)
✅ confirmed_order_addons (created)
```

**Default Data Inserted:**
```
✅ Admin user: username: admin, password: cyclebees123
✅ 8 Add-on services (₹80 to ₹350 range)
```

**Functions & Triggers:**
```
✅ generate_short_slug() - Creates unique 8-character URLs
✅ set_short_slug() - Auto-generates slugs for new requests
✅ update_request_totals() - Auto-calculates pricing
✅ 4 triggers for automatic updates
```

### **Step 3: Test the Application**
1. Start your development server: `npm run dev`
2. Test admin login: `http://localhost:3000/admin/login`
   - Username: `admin`
   - Password: `cyclebees123`
3. Test add-ons API: `http://localhost:3000/api/addons`
   - Should return 8 default add-on services

## 🔍 Migration Script Features

### **Safe Migration Approach:**
- ✅ **Non-destructive** - Won't delete existing data
- ✅ **Conditional updates** - Only adds missing columns/tables
- ✅ **Data preservation** - Keeps all your existing requests and items
- ✅ **Backward compatible** - Updates existing records to new format

### **Smart Updates:**
- **Existing requests** get auto-generated `short_slug` and `order_id`
- **Existing items** get proper `section` classification
- **Missing columns** are added with sensible defaults
- **Data integrity** is maintained throughout

### **What Gets Added:**
```sql
-- New columns in 'requests' table:
+ short_slug (unique 8-char identifier)
+ order_id (CB + timestamp format)
+ bike_name, customer_name, phone_digits_intl
+ status (draft/viewed/confirmed/cancelled)
+ subtotal_paise, tax_paise, total_paise
+ sent_at timestamp

-- New columns in 'request_items' table:
+ section (repair/replacement)
+ label (service description)
+ price_paise (pricing in paise)
+ is_suggested (recommended flag)

-- New tables:
+ admin_credentials (admin auth)
+ addons (add-on services)
+ confirmed_order_services (customer selections)
+ confirmed_order_addons (add-on selections)
```

## 🛠️ Troubleshooting

### **If Migration Fails:**
1. **Check error message** - Note which line failed
2. **Run sections separately** - Copy smaller portions of the script
3. **Check permissions** - Ensure you have admin access to Supabase
4. **Verify connection** - Make sure your Supabase project is active

### **Common Issues:**
- **Foreign key errors**: If existing data references don't match
- **Constraint violations**: If existing data doesn't meet new requirements
- **Permission errors**: If your Supabase user lacks privileges

### **Verification Queries:**
Run these in SQL Editor after migration:
```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Check admin user exists
SELECT username FROM admin_credentials;

-- Check add-ons exist  
SELECT COUNT(*) FROM addons;

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
```

## 📊 Expected Results

### **Before Migration:**
```
Tables: requests, request_items (2 tables)
Data: Your existing requests and items only
Functions: None
Triggers: None
Default data: None
Status: ❌ Application won't work properly
```

### **After Migration:**
```
Tables: 6 tables total (all required)
Data: Existing data + admin user + 8 add-on services
Functions: 3 functions for automation
Triggers: 4 triggers for data consistency
Indexes: 7 indexes for performance
Status: ✅ Application fully functional
```

## ✅ Success Indicators

**You'll know the migration worked when:**
1. **Admin login works** - Can access `/admin` with admin/cyclebees123
2. **Add-on services load** - API returns 8 services
3. **No database errors** - Application starts without errors
4. **All features work** - Can create requests, select add-ons, generate PDFs

## 🔒 Security Note

The migration creates a default admin user:
- **Username:** `admin`  
- **Password:** `cyclebees123`

**⚠️ For production use, change this password immediately after testing!**

## 📞 Need Help?

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify your `.env.local` has correct Supabase credentials
3. Ensure your Supabase project has not expired or been paused
4. Make sure you have proper permissions on the Supabase project

---

**Ready to migrate? Copy `database/supabase_migration.sql` to your Supabase SQL Editor and run it! 🚀**