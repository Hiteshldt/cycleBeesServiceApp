# 🧹 CycleBees Clean Database Setup Instructions

## ⚠️ WARNING: FRESH START APPROACH
This script will **DELETE ALL EXISTING DATA** and create a completely fresh database. Use this if you want to start clean without any old data.

## 🎯 What This Script Does

**🗑️ REMOVES:**
- All existing tables and data
- All functions and triggers  
- All indexes
- Everything in your current database

**✅ CREATES:**
- Complete fresh database schema
- All 6 required tables
- All functions and triggers
- All performance indexes
- Default admin user
- 8 default add-on services

## 🚀 Setup Steps

### **Step 1: Backup (Optional)**
If you have any data you might want to keep, export it first:
1. Go to Supabase Dashboard → Database
2. Use the backup/export feature if needed

### **Step 2: Run Clean Setup**
1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Create a new query
4. Copy the entire content of `database/clean_supabase_setup.sql`
5. Paste it into the SQL Editor
6. Click **RUN** to execute

### **Step 3: Verify Setup**
After running, you should see this output from the verification queries:

**Tables Created (6 total):**
```
requests (10 columns)
request_items (6 columns) 
admin_credentials (5 columns)
addons (6 columns)
confirmed_order_services (3 columns)
confirmed_order_addons (3 columns)
```

**Admin User Created:**
```
username: admin
password: cyclebees123
is_active: true
```

**Add-on Services (8 total):**
```
1. Premium Bike Wash & Polish (₹200)
2. Engine Deep Clean & Detailing (₹300)
3. Chain & Sprocket Complete Service (₹120)
4. Brake System Service (₹150)
5. Complete Fluid Service (₹250)
6. Tire Care Package (₹80)
7. Electrical System Check (₹100)
8. Performance Tuning (₹350)
```

**Functions Created:**
```
generate_short_slug (function)
set_short_slug (function)
update_request_totals (function)
```

**Triggers Created:**
```
trigger_set_short_slug (on requests)
trigger_update_totals_insert (on request_items)
trigger_update_totals_update (on request_items)
trigger_update_totals_delete (on request_items)
```

## ✅ Test Your Setup

### **1. Start Application**
```bash
npm run dev
```

### **2. Test Admin Login**
- Go to: `http://localhost:3000/admin/login`
- Username: `admin`
- Password: `cyclebees123`
- Should successfully log in

### **3. Test Add-ons API**
- Go to: `http://localhost:3000/api/addons`
- Should return JSON with 8 add-on services
- No database errors in console

### **4. Test Full Workflow**
- Create a new request in admin panel
- Send WhatsApp link (will generate automatically)
- Test customer flow (services → add-ons → confirmation)

## 🔧 If Something Goes Wrong

### **Common Issues:**

**1. Permission Errors**
- Make sure you have admin access to your Supabase project
- Check that your project is not paused/expired

**2. Foreign Key Errors**
- The script drops tables in the correct order
- Run the script in one go (don't run parts separately)

**3. Function/Trigger Errors**
- Make sure you have plpgsql extension enabled
- Clear browser cache and restart dev server

### **Troubleshooting Steps:**
1. Check Supabase logs for specific errors
2. Verify your `.env.local` has correct credentials
3. Try running verification queries manually
4. Restart your development server

## 📊 What You Get

### **Complete Database Schema:**
```sql
-- Main business tables
requests (service requests)
request_items (repair/replacement items)
addons (premium add-on services)

-- Authentication
admin_credentials (admin login)

-- Order tracking  
confirmed_order_services (customer service selections)
confirmed_order_addons (customer add-on selections)
```

### **Automation Features:**
- **Auto-generated slugs** - Unique 8-char URLs for orders
- **Auto-calculated totals** - Pricing updates automatically
- **Data integrity** - Foreign keys and constraints
- **Performance optimization** - Strategic indexes

### **Default Data:**
- **Admin access** ready to use
- **8 professional add-on services** already configured
- **Pricing in paise** (Indian currency format)
- **Display order** configured for UI

## 🎉 Success Indicators

**✅ You'll know it worked when:**
1. No errors during SQL execution
2. Admin login works immediately  
3. Add-ons API returns 8 services
4. Application starts without database errors
5. You can create and manage requests
6. Customer flow works completely

## 🔒 Security Note

**Default Admin Credentials:**
- Username: `admin`
- Password: `cyclebees123`

**⚠️ IMPORTANT: Change this password for production use!**

## 🚀 Ready to Go!

After running this clean setup script, your CycleBees application will be:
- ✅ **100% Functional** - All features working
- ✅ **Production Ready** - Proper schema and constraints
- ✅ **Optimized** - Indexes and triggers for performance
- ✅ **Secure** - Admin authentication system
- ✅ **Complete** - All required data pre-loaded

Your database will be completely fresh and ready to handle the full CycleBees workflow from admin request creation to customer order confirmation and PDF generation.

---
**Ready for a fresh start? Run `database/clean_supabase_setup.sql` in your Supabase SQL Editor! 🧹✨**