# 🔌 **API Endpoints Testing Guide**

## **Test These URLs After Deployment:**

### 1. **Public Bundles API** (Customer-facing)
```
GET https://yourdomain.com/api/bundles
```
**Expected Response:**
```json
[
  {
    "id": "uuid-here",
    "name": "Complete Care Package",
    "description": "Comprehensive bike maintenance and care",
    "price_paise": 250000,
    "bullet_points": [
      "Full bike inspection and diagnostics",
      "Complete cleaning and detailing",
      "Chain lubrication and adjustment",
      "Brake system check and adjustment",
      "Tire pressure and alignment check",
      "30-day service warranty"
    ],
    "is_active": true,
    "display_order": 1,
    "created_at": "2024-xx-xx...",
    "updated_at": "2024-xx-xx..."
  },
  // ... 3 more bundles
]
```

### 2. **Admin Bundles API** (Admin-only)
```
GET https://yourdomain.com/api/admin/bundles
```
**Expected:** Same as above but includes inactive bundles too

### 3. **Test Bundle Creation** (Admin-only)
```
POST https://yourdomain.com/api/admin/bundles
Content-Type: application/json

{
  "name": "Test Bundle",
  "description": "Testing bundle creation",
  "price_paise": 50000,
  "bullet_points": ["Test feature 1", "Test feature 2"],
  "display_order": 5
}
```

## **Browser Testing URLs:**

### Admin Interface:
- `https://yourdomain.com/admin/settings` - Should show bundles section

### Customer Interface:
- `https://yourdomain.com/o/[any-order-slug]/addons` - Should show bundles below add-ons

## **Quick Browser Tests:**

1. **Open Browser Console** (F12)
2. **Test API Call:**
```javascript
fetch('/api/bundles')
  .then(r => r.json())
  .then(data => {
    console.log('Bundles API Response:', data);
    console.log('✅ Found', data.length, 'active bundles');
    data.forEach(bundle => {
      console.log('📦', bundle.name, '- ₹' + (bundle.price_paise/100), '- Features:', bundle.bullet_points.length);
    });
  })
  .catch(err => console.error('❌ API Error:', err));
```

## **Expected Results:**
- ✅ 4 bundles returned
- ✅ Each bundle has bullet_points array
- ✅ Prices in paise format (multiply by 100)
- ✅ All bundles have is_active: true