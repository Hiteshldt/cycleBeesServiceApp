# 🧪 TESTING GUIDE

**Complete testing procedures for WhatsApp automation system**

---

## ⚡ QUICK TEST CHECKLIST

Run these 5 critical tests before deployment:

1. ✅ Valid WhatsApp number → Should send & mark 'sent'
2. ✅ Invalid number → Should stay 'pending' with error  
3. ✅ Phone validation → Red error if not 10 digits
4. ✅ Confirmation modal → Shows formatted phone
5. ✅ Dashboard filters → Pending/Sent filtering works

**Time:** ~10 minutes total

---

## TEST 1: Valid WhatsApp Number

**Setup:**
```bash
npm run dev
```

**Steps:**
1. Go to http://localhost:3000/admin/new
2. Fill form:
   - Customer: Your Name
   - Bike: Test Bike  
   - Phone: **YOUR ACTUAL NUMBER** (10 digits)
   - Add 1 repair item (₹100)
3. Click "Save & Send via WhatsApp"
4. Click "Confirm & Send"

**Expected:**
- ✅ Alert: "✅ Request created... Message ID: wamid..."
- ✅ WhatsApp message received
- ✅ Terminal: `✅ WhatsApp message sent successfully`

**Verify Database:**
```sql
SELECT order_id, status, whatsapp_message_id, whatsapp_error
FROM requests ORDER BY created_at DESC LIMIT 1;
```
- status = 'sent'
- whatsapp_message_id = 'wamid...'
- whatsapp_error = null

---

## TEST 2: Invalid WhatsApp Number

**Steps:**
1. Create request with fake number: **9999999999**

**Expected:**
- ✅ Alert: "⚠️ Request saved as PENDING: not registered..."
- ✅ NO WhatsApp message
- ✅ Terminal: `❌ WhatsApp API error detected`

**Verify Database:**
```sql
SELECT order_id, status, whatsapp_error
FROM requests ORDER BY created_at DESC LIMIT 1;
```
- status = 'pending'
- whatsapp_error = 'This phone number is not registered...'

---

## TEST 3: Phone Validation

**Test 3a:** Type 5 digits
- ✅ RED error: "❌ Must be exactly 10 digits (currently: 5)"
- ✅ Button disabled

**Test 3b:** Type 11 digits  
- ✅ RED error: "❌ Must be exactly 10 digits (currently: 11)"
- ✅ Button disabled

**Test 3c:** Type exactly 10 digits
- ✅ BLUE info: "📝 10-digit number (91 added auto)"
- ✅ Button enabled

---

## TEST 4: Confirmation Modal

**Steps:**
1. Fill form with valid phone
2. Click "Save & Send via WhatsApp"

**Expected:**
- ✅ Modal appears
- ✅ Shows formatted phone: "+91 70051 92650"
- ✅ Shows customer name, bike name
- ✅ "Cancel" closes without saving
- ✅ "Confirm" proceeds

---

## TEST 5: Dashboard Filters

**Prerequisites:** Have 1 'sent' and 1 'pending' request

**Steps:**
1. Go to http://localhost:3000/admin
2. Click "⏳ Pending"
   - ✅ Shows only pending requests
   - ✅ Amber badge with pulse
3. Click "Sent"
   - ✅ Shows only sent requests
   - ✅ Blue badge

---

## 🔧 ADVANCED TESTS (Optional)

### Test 6: Timeout Protection

Add 35-second delay node in n8n, then:
- ✅ After ~30s: Gets timeout error
- ✅ Request stays 'pending'

### Test 7: Loading Protection

1. Click "Confirm & Send"
2. Try to close tab immediately
   - ✅ Browser shows warning
   - ✅ Can cancel to stay

### Test 8: Rapid Requests

Create 3 requests within 1 minute:
- ✅ All 3 created successfully
- ✅ No race conditions

---

## 📊 VERIFICATION QUERIES

After all tests:

```sql
-- Count by status
SELECT status, COUNT(*) FROM requests GROUP BY status;

-- Recent requests
SELECT order_id, status, whatsapp_message_id IS NOT NULL as has_msg_id
FROM requests ORDER BY created_at DESC LIMIT 5;

-- Check for inconsistencies (should be 0)
SELECT COUNT(*) FROM requests
WHERE status = 'sent' AND whatsapp_message_id IS NULL
AND created_at > NOW() - INTERVAL '1 hour';
```

---

## ✅ SUCCESS CRITERIA

All tests pass if:
- ✅ Valid number → sent + message_id saved
- ✅ Invalid number → pending + error saved
- ✅ Phone validation works correctly
- ✅ Modal displays properly
- ✅ Dashboard filters work
- ✅ No console errors

**If all pass: Ready for production!** 🚀

---

## 🐛 TROUBLESHOOTING

### Issue: n8n returns empty `{}`

**Fix:** Enable "Continue On Fail" in WhatsApp node

### Issue: All requests stuck pending

**Fix:** Check N8N_WEBHOOK_URL and verify workflow activated

### Issue: Valid numbers marked pending

**Fix:** Check n8n execution logs for errors

---

**Run these tests before every deployment!**
