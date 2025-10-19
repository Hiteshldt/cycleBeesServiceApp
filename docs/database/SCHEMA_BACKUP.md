# CycleBees Database Schema Backup

**Generated**: 2025-10-19T19:07:49.796Z **Database**:
https://zhsiykictemrbkmbzkye.supabase.co

---

## Table of Contents

1. [Tables Overview](#tables-overview)
2. [Table Details](#table-details)
3. [Data Samples](#data-samples)

---

## Tables Overview

| Table                      | Exists | Row Count | Status   |
| -------------------------- | ------ | --------- | -------- |
| `requests`                 | ✅     | 1         | Has data |
| `request_items`            | ✅     | 3         | Has data |
| `request_notes`            | ✅     | 0         | Empty    |
| `confirmed_order_services` | ✅     | 2         | Has data |
| `confirmed_order_addons`   | ✅     | 1         | Has data |
| `confirmed_order_bundles`  | ✅     | 0         | Empty    |
| `addons`                   | ✅     | 4         | Has data |
| `service_bundles`          | ✅     | 3         | Has data |
| `lacarte_settings`         | ✅     | 1         | Has data |
| `admin_credentials`        | ✅     | 1         | Has data |

---

## Table Details

### requests

**Status**: ✅ Exists **Row Count**: 1

**Schema** (from sample row):

| Column                | Type   | Sample Value                                         |
| --------------------- | ------ | ---------------------------------------------------- |
| `id`                  | string | "3d7d1540-2faf-447d-894e-64d441c19476"               |
| `short_slug`          | string | "EEZ9NM17"                                           |
| `order_id`            | string | "CB251020000766"                                     |
| `bike_name`           | string | "Rodeo Max"                                          |
| `customer_name`       | string | "Hitesh Gupta"                                       |
| `phone_digits_intl`   | string | "917005192650"                                       |
| `status`              | string | "confirmed"                                          |
| `subtotal_paise`      | number | 30000                                                |
| `tax_paise`           | number | 0                                                    |
| `total_paise`         | number | 89800                                                |
| `created_at`          | string | "2025-10-19T18:37:53.411193+00:00"                   |
| `sent_at`             | string | "2025-10-19T18:37:58.574+00:00"                      |
| `whatsapp_message_id` | string | "wamid.HBgMOTE3MDA1MTkyNjUwFQIAERgSRDgyMUI3OTIxQ..." |
| `whatsapp_sent_at`    | string | "2025-10-19T18:37:58.574+00:00"                      |
| `whatsapp_error`      | object | null                                                 |
| `lacarte_paise`       | number | 9900                                                 |
| `invoice_pdf_url`     | object | null                                                 |
| `invoice_sent_at`     | object | null                                                 |

### request_items

**Status**: ✅ Exists **Row Count**: 3

**Schema** (from sample row):

| Column         | Type    | Sample Value                           |
| -------------- | ------- | -------------------------------------- |
| `id`           | string  | "ecdb2d36-634c-43c9-be3b-0a38e32340bf" |
| `request_id`   | string  | "3d7d1540-2faf-447d-894e-64d441c19476" |
| `section`      | string  | "repair"                               |
| `label`        | string  | "Tyre Fix "                            |
| `price_paise`  | number  | 10000                                  |
| `is_suggested` | boolean | true                                   |
| `created_at`   | string  | "2025-10-19T18:37:53.768121+00:00"     |

### request_notes

**Status**: ✅ Exists **Row Count**: 0

**Schema**: No sample data available (table is empty)

### confirmed_order_services

**Status**: ✅ Exists **Row Count**: 2

**Schema** (from sample row):

| Column            | Type   | Sample Value                           |
| ----------------- | ------ | -------------------------------------- |
| `id`              | string | "60154ab4-feb5-48c9-a979-420d4dd49621" |
| `request_id`      | string | "3d7d1540-2faf-447d-894e-64d441c19476" |
| `service_item_id` | string | "ecdb2d36-634c-43c9-be3b-0a38e32340bf" |
| `selected_at`     | string | "2025-10-19T18:39:25.677956+00:00"     |

### confirmed_order_addons

**Status**: ✅ Exists **Row Count**: 1

**Schema** (from sample row):

| Column        | Type   | Sample Value                           |
| ------------- | ------ | -------------------------------------- |
| `id`          | string | "b0765c2f-cd74-4ab0-9d35-24a3dc591304" |
| `request_id`  | string | "3d7d1540-2faf-447d-894e-64d441c19476" |
| `addon_id`    | string | "196768b1-8d30-4972-884d-81761ac0e0c9" |
| `selected_at` | string | "2025-10-19T18:39:25.910184+00:00"     |

### confirmed_order_bundles

**Status**: ✅ Exists **Row Count**: 0

**Schema**: No sample data available (table is empty)

### addons

**Status**: ✅ Exists **Row Count**: 4

**Schema** (from sample row):

| Column          | Type    | Sample Value                           |
| --------------- | ------- | -------------------------------------- |
| `id`            | string  | "9a3fdced-a42d-4f2d-b083-d54e2a4bcb3e" |
| `name`          | string  | "Bicycle Bell"                         |
| `description`   | string  | "Popular Chrome"                       |
| `price_paise`   | number  | 9900                                   |
| `is_active`     | boolean | true                                   |
| `display_order` | number  | 1                                      |
| `created_at`    | string  | "2025-10-02T17:26:52.070574+00:00"     |

### service_bundles

**Status**: ✅ Exists **Row Count**: 3

**Schema** (from sample row):

| Column          | Type    | Sample Value                                                                                                                 |
| --------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `id`            | string  | "88ec6084-5fa6-46f4-9359-531bc86a8009"                                                                                       |
| `name`          | string  | "Tune Up Service Package"                                                                                                    |
| `description`   | string  | "Features: • • Adjustment Brake • • •"                                                                                       |
| `price_paise`   | number  | 29900                                                                                                                        |
| `bullet_points` | object  | ["Safety Bolt Check Gear","Adjustment Brake","Adjustment Seat Adjustment","Inflate Tyres","Bottom Bracket check/adjustment"] |
| `is_active`     | boolean | true                                                                                                                         |
| `display_order` | number  | 2                                                                                                                            |
| `created_at`    | string  | "2025-10-02T17:27:20.084203+00:00"                                                                                           |
| `updated_at`    | string  | "2025-10-02T17:27:20.084203+00:00"                                                                                           |

### lacarte_settings

**Status**: ✅ Exists **Row Count**: 1

**Schema** (from sample row):

| Column                | Type    | Sample Value                    |
| --------------------- | ------- | ------------------------------- |
| `id`                  | string  | "lacarte"                       |
| `real_price_paise`    | number  | 24900                           |
| `current_price_paise` | number  | 9900                            |
| `discount_note`       | string  | "Diwali Sale"                   |
| `is_active`           | boolean | true                            |
| `created_at`          | string  | "2025-10-05T17:42:15.304+00:00" |
| `updated_at`          | string  | "2025-10-13T03:23:57.092+00:00" |

### admin_credentials

**Status**: ✅ Exists **Row Count**: 1

**Schema** (from sample row):

| Column       | Type    | Sample Value                                         |
| ------------ | ------- | ---------------------------------------------------- |
| `id`         | string  | "de2f10e7-6909-4e82-a6c3-4dc71bc83754"               |
| `username`   | string  | "admin"                                              |
| `password`   | string  | "$2b$10$.d3gCn.iXVAe6/5WX15byuCXYSkax3RdelmPmRfm..." |
| `is_active`  | boolean | true                                                 |
| `created_at` | string  | "2025-10-02T17:26:14+00:00"                          |

---

## Data Samples

### requests Sample Data

```json
[
  {
    "id": "3d7d1540-2faf-447d-894e-64d441c19476",
    "short_slug": "EEZ9NM17",
    "order_id": "CB251020000766",
    "bike_name": "Rodeo Max",
    "customer_name": "Hitesh Gupta",
    "phone_digits_intl": "917005192650",
    "status": "confirmed",
    "subtotal_paise": 30000,
    "tax_paise": 0,
    "total_paise": 89800,
    "created_at": "2025-10-19T18:37:53.411193+00:00",
    "sent_at": "2025-10-19T18:37:58.574+00:00",
    "whatsapp_message_id": "wamid.HBgMOTE3MDA1MTkyNjUwFQIAERgSRDgyMUI3OTIxQTdDQkNCRjVDAA==",
    "whatsapp_sent_at": "2025-10-19T18:37:58.574+00:00",
    "whatsapp_error": null,
    "lacarte_paise": 9900,
    "invoice_pdf_url": null,
    "invoice_sent_at": null
  }
]
```

### request_items Sample Data

```json
[
  {
    "id": "ecdb2d36-634c-43c9-be3b-0a38e32340bf",
    "request_id": "3d7d1540-2faf-447d-894e-64d441c19476",
    "section": "repair",
    "label": "Tyre Fix ",
    "price_paise": 10000,
    "is_suggested": true,
    "created_at": "2025-10-19T18:37:53.768121+00:00"
  },
  {
    "id": "2118a991-4bb2-43a9-aa2b-60f2a183b1c3",
    "request_id": "3d7d1540-2faf-447d-894e-64d441c19476",
    "section": "replacement",
    "label": "Fix",
    "price_paise": 10000,
    "is_suggested": true,
    "created_at": "2025-10-19T18:37:53.768121+00:00"
  },
  {
    "id": "a38e1ea5-8bca-40b7-824d-75f7427b33f7",
    "request_id": "3d7d1540-2faf-447d-894e-64d441c19476",
    "section": "replacement",
    "label": "Fix 2",
    "price_paise": 20000,
    "is_suggested": true,
    "created_at": "2025-10-19T18:37:53.768121+00:00"
  }
]
```

### addons Sample Data

```json
[
  {
    "id": "9a3fdced-a42d-4f2d-b083-d54e2a4bcb3e",
    "name": "Bicycle Bell",
    "description": "Popular Chrome",
    "price_paise": 9900,
    "is_active": true,
    "display_order": 1,
    "created_at": "2025-10-02T17:26:52.070574+00:00"
  },
  {
    "id": "196768b1-8d30-4972-884d-81761ac0e0c9",
    "name": "Gel Bicycle Saddle Seat Cushion Cover",
    "description": "Gel Bicycle Saddle Seat Cushion Cover",
    "price_paise": 49900,
    "is_active": true,
    "display_order": 2,
    "created_at": "2025-10-05T17:41:56.010522+00:00"
  },
  {
    "id": "69133432-e059-425e-aec0-ea63fca628c6",
    "name": "Bicycle LED Tail Light",
    "description": "Lista USB Rechargeable (Red Color)",
    "price_paise": 17900,
    "is_active": true,
    "display_order": 3,
    "created_at": "2025-10-18T19:03:10.313872+00:00"
  }
]
```

### service_bundles Sample Data

```json
[
  {
    "id": "88ec6084-5fa6-46f4-9359-531bc86a8009",
    "name": "Tune Up Service Package",
    "description": "Features:  • • Adjustment Brake •  •  •",
    "price_paise": 29900,
    "bullet_points": [
      "Safety Bolt Check Gear",
      "Adjustment Brake",
      "Adjustment Seat Adjustment",
      "Inflate Tyres",
      "Bottom Bracket check/adjustment"
    ],
    "is_active": true,
    "display_order": 2,
    "created_at": "2025-10-02T17:27:20.084203+00:00",
    "updated_at": "2025-10-02T17:27:20.084203+00:00"
  },
  {
    "id": "bf330f7e-2e04-40ee-be05-6a6cd5d2c784",
    "name": "Standard Service Package",
    "description": "Standard Service Package",
    "price_paise": 49900,
    "bullet_points": [
      "In addition to Tune Up Package",
      "Reset & Adjust Gears",
      "Reset & Adjust Brakes",
      "Lube Drivetrain Lube",
      "Cables Wheel Truing"
    ],
    "is_active": true,
    "display_order": 2,
    "created_at": "2025-10-18T19:05:37.273792+00:00",
    "updated_at": "2025-10-18T19:05:37.273792+00:00"
  },
  {
    "id": "7bf55317-ca27-40dc-8df3-2b5ead9e7fe8",
    "name": "Premium Service Package",
    "description": "Premium Service Package",
    "price_paise": 99900,
    "bullet_points": [
      "In addition to Standard Service",
      "Package Degrease",
      "Derailleurs Degrease",
      "Package Degrease",
      "In addition to Standard Service"
    ],
    "is_active": true,
    "display_order": 3,
    "created_at": "2025-10-18T19:06:40.717122+00:00",
    "updated_at": "2025-10-18T19:06:40.717122+00:00"
  }
]
```

### lacarte_settings Sample Data

```json
[
  {
    "id": "lacarte",
    "real_price_paise": 24900,
    "current_price_paise": 9900,
    "discount_note": "Diwali Sale",
    "is_active": true,
    "created_at": "2025-10-05T17:42:15.304+00:00",
    "updated_at": "2025-10-13T03:23:57.092+00:00"
  }
]
```

---

## Relationships

### requests → request_items

- `request_items.request_id` → `requests.id`
- **Cascade**: ON DELETE CASCADE

### requests → confirmed_order_services

- `confirmed_order_services.request_id` → `requests.id`
- **Cascade**: ON DELETE CASCADE

### requests → confirmed_order_addons

- `confirmed_order_addons.request_id` → `requests.id`
- **Cascade**: ON DELETE CASCADE

### requests → confirmed_order_bundles

- `confirmed_order_bundles.request_id` → `requests.id`
- **Cascade**: ON DELETE CASCADE

### requests → request_notes (if exists)

- `request_notes.request_id` → `requests.id`
- **Cascade**: ON DELETE CASCADE

### confirmed_order_services → request_items

- `confirmed_order_services.service_item_id` → `request_items.id`
- **Cascade**: ON DELETE CASCADE

### confirmed_order_addons → addons

- `confirmed_order_addons.addon_id` → `addons.id`
- **Cascade**: ON DELETE CASCADE

### confirmed_order_bundles → service_bundles

- `confirmed_order_bundles.bundle_id` → `service_bundles.id`
- **Cascade**: ON DELETE CASCADE

---

## Notes

- All prices stored in **paise** (1 rupee = 100 paise)
- Timestamps use **TIMESTAMP WITH TIME ZONE**
- UUIDs generated via **uuid_generate_v4()**
- Database trigger `update_request_totals()` auto-calculates totals
- Short slugs generated via `generate_short_slug()` function

---

**Backup Complete**: 2025-10-19T19:07:53.885Z
