# CycleBees Services - API Documentation

**Version**: 1.0.0 **Last Updated**: 2025-10-19 **Base URL**:
`https://your-domain.com` (or `http://localhost:3000` for development)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication-endpoints)
   - [Service Requests](#service-requests-endpoints)
   - [Add-ons Management](#add-ons-endpoints)
   - [Bundles Management](#bundles-endpoints)
   - [La Carte Pricing](#la-carte-endpoints)
   - [Analytics](#analytics-endpoints)
   - [Public APIs](#public-apis)
   - [Webhooks](#webhooks)
6. [Request & Response Schemas](#schemas)
7. [Status Codes](#status-codes)

---

## Overview

The CycleBees Services API is a RESTful API built with Next.js 15 App Router. It
provides endpoints for:

- **Admin Operations**: Manage service requests, pricing, add-ons, and bundles
- **Customer Interactions**: View estimates, confirm orders, select services
- **WhatsApp Integration**: Automated notifications via n8n webhooks
- **Analytics**: Business intelligence and metrics

**Key Technologies**:

- **Runtime**: Next.js 15.5.2 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (jsonwebtoken for Node.js, jose for Edge runtime)
- **Validation**: Zod schemas
- **Password Hashing**: bcrypt

---

## Authentication

### JWT Token-Based Authentication

**Protected Routes**: All `/api/admin/*` endpoints require JWT authentication
(except `/api/admin/auth`).

#### How Authentication Works

1. **Login**: POST to `/api/admin/auth` with username and password
2. **Receive Token**: Get a JWT token in the response
3. **Use Token**: Include token in `Authorization` header for protected
   requests:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

#### Token Verification

The `middleware.ts` file intercepts all `/admin/*` routes and validates the JWT
token before allowing access.

**Middleware Location**: `middleware.ts:1`

**Authentication Functions**:

- Node.js runtime: `lib/auth.ts:1` (jsonwebtoken + bcrypt)
- Edge runtime: `lib/auth-edge.ts:1` (jose library)

---

## Response Format

### Success Response

```json
{
  "data": {
    /* Response payload */
  },
  "message": "Operation successful" // Optional
}
```

### Error Response

```json
{
  "error": "Human-readable error message",
  "details": {
    /* Optional validation errors or additional info */
  }
}
```

---

## Error Handling

### Common Error Codes

| Status Code | Meaning               | Common Causes                                   |
| ----------- | --------------------- | ----------------------------------------------- |
| `400`       | Bad Request           | Invalid input data, validation failure          |
| `401`       | Unauthorized          | Missing or invalid JWT token, wrong credentials |
| `403`       | Forbidden             | Valid token but insufficient permissions        |
| `404`       | Not Found             | Resource doesn't exist (request, addon, etc.)   |
| `500`       | Internal Server Error | Database error, unexpected server issue         |

### Validation Errors

Validation errors return a `400` status with details:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "path": ["customer_name"],
      "message": "Customer name is required"
    }
  ]
}
```

---

## API Endpoints

### Authentication Endpoints

#### `POST /api/admin/auth`

**Description**: Authenticate admin user and receive JWT token

**Authentication**: None (public endpoint)

**Request Body**:

```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:

- `400`: Missing username or password
- `401`: Invalid credentials
- `500`: Server error

**Source**: `app/api/admin/auth/route.ts:1`

---

#### `POST /api/admin/verify-token`

**Description**: Verify if a JWT token is valid

**Authentication**: None (public endpoint for token validation)

**Request Body**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):

```json
{
  "valid": true,
  "payload": {
    "userId": "uuid",
    "username": "admin"
  }
}
```

**Errors**:

- `400`: Missing token
- `401`: Invalid or expired token

**Source**: `app/api/admin/verify-token/route.ts:1`

---

### Service Requests Endpoints

#### `GET /api/requests`

**Description**: List service requests with pagination, filtering, and search

**Authentication**: Required (admin)

**Query Parameters**:

| Parameter         | Type                | Default | Description                                                                    |
| ----------------- | ------------------- | ------- | ------------------------------------------------------------------------------ |
| `status`          | string              | all     | Filter by status: `pending`, `sent`, `viewed`, `confirmed`, `cancelled`, `all` |
| `search`          | string              | -       | Search in order_id, customer_name, bike_name, phone, slug                      |
| `start_date`      | string (YYYY-MM-DD) | -       | Filter by creation date (from)                                                 |
| `end_date`        | string (YYYY-MM-DD) | -       | Filter by creation date (to)                                                   |
| `page`            | number              | 1       | Page number (min: 1)                                                           |
| `limit`           | number              | 30      | Items per page (min: 1, max: 1000)                                             |
| `include_details` | boolean             | false   | Include full request items (for CSV export)                                    |

**Response** (200 OK):

```json
{
  "requests": [
    {
      "id": "uuid",
      "order_id": "ORD-001",
      "customer_name": "John Doe",
      "bike_name": "Royal Enfield Classic 350",
      "phone_digits_intl": "919876543210",
      "status": "sent",
      "short_slug": "abc123",
      "lacarte_paise": 150000,
      "total_paise": 175000,
      "whatsapp_sent_at": "2025-10-19T10:30:00Z",
      "created_at": "2025-10-19T09:00:00Z",
      "updated_at": "2025-10-19T10:30:00Z",
      "request_items": [
        {
          "id": "uuid",
          "section": "repair",
          "label": "Engine oil change",
          "price_paise": 15000
        }
      ],
      "total_items": 5
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalRequests": 75,
    "limit": 30,
    "hasNextPage": true,
    "hasPrevPage": false,
    "startIndex": 1,
    "endIndex": 30
  }
}
```

**Errors**:

- `401`: Missing or invalid JWT token
- `500`: Database error

**Source**: `app/api/requests/route.ts:6`

---

#### `POST /api/requests`

**Description**: Create a new service request

**Authentication**: Required (admin)

**Request Body**:

```json
{
  "request": {
    "order_id": "ORD-001",
    "bike_name": "Royal Enfield Classic 350",
    "customer_name": "John Doe",
    "phone_digits_intl": "9876543210",
    "status": "pending",
    "lacarte_paise": 150000
  },
  "repair_items": [
    {
      "label": "Engine oil change",
      "price_paise": 15000,
      "is_suggested": true
    }
  ],
  "replacement_items": [
    {
      "label": "Air filter",
      "price_paise": 8500,
      "is_suggested": false
    }
  ]
}
```

**Validation Rules**:

- `order_id`: 1-100 characters
- `bike_name`: 1-200 characters
- `customer_name`: 1-200 characters
- `phone_digits_intl`: 10-15 digits (auto-adds "91" prefix for 10-digit numbers)
- `status`: One of: `pending`, `sent`, `viewed`, `confirmed`, `cancelled`
- `lacarte_paise`: 0-10,000,000 (optional, nullable)
- `price_paise`: 1-10,000,000 per item
- `label`: 1-500 characters per item

**Response** (201 Created):

```json
{
  "id": "uuid",
  "short_slug": "abc123",
  "message": "Request created successfully"
}
```

**Errors**:

- `400`: Validation failed (see `details` array for specific errors)
- `401`: Missing or invalid JWT token
- `500`: Database error

**Source**: `app/api/requests/route.ts:157`

---

#### `GET /api/requests/[id]`

**Description**: Get a single service request by ID

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the request

**Response** (200 OK):

```json
{
  "id": "uuid",
  "order_id": "ORD-001",
  "customer_name": "John Doe",
  "bike_name": "Royal Enfield Classic 350",
  "phone_digits_intl": "919876543210",
  "status": "sent",
  "short_slug": "abc123",
  "lacarte_paise": 150000,
  "total_paise": 175000,
  "whatsapp_sent_at": "2025-10-19T10:30:00Z",
  "created_at": "2025-10-19T09:00:00Z",
  "updated_at": "2025-10-19T10:30:00Z",
  "request_items": [
    /* Full items array */
  ]
}
```

**Errors**:

- `401`: Missing or invalid JWT token
- `404`: Request not found
- `500`: Database error

**Source**: `app/api/requests/[id]/route.ts:1`

---

#### `PATCH /api/requests/[id]`

**Description**: Update a service request

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the request

**Request Body** (partial update allowed):

```json
{
  "customer_name": "John Doe Updated",
  "status": "confirmed",
  "lacarte_paise": 160000
}
```

**Response** (200 OK):

```json
{
  "id": "uuid",
  "message": "Request updated successfully"
  /* Updated request object */
}
```

**Errors**:

- `400`: Validation failed
- `401`: Missing or invalid JWT token
- `404`: Request not found
- `500`: Database error

**Source**: `app/api/requests/[id]/route.ts:1`

---

#### `DELETE /api/requests/[id]`

**Description**: Delete a service request

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the request

**Response** (200 OK):

```json
{
  "message": "Request deleted successfully"
}
```

**Errors**:

- `401`: Missing or invalid JWT token
- `404`: Request not found
- `500`: Database error

**Source**: `app/api/requests/[id]/route.ts:1`

---

#### `POST /api/requests/[id]/confirmed`

**Description**: Mark a request as confirmed (customer acceptance)

**Authentication**: None (public endpoint for customers)

**URL Parameters**:

- `id`: UUID of the request

**Response** (200 OK):

```json
{
  "message": "Request confirmed successfully"
}
```

**Errors**:

- `404`: Request not found
- `500`: Database error

**Source**: `app/api/requests/[id]/confirmed/route.ts:1`

---

#### `GET /api/requests/[id]/pdf`

**Description**: Generate and download PDF bill for a request

**Authentication**: None (public endpoint, requires valid request ID)

**URL Parameters**:

- `id`: UUID of the request

**Response** (200 OK):

- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename="CycleBees_Bill_ORD-001.pdf"`
- **Body**: Binary PDF data

**Errors**:

- `404`: Request not found
- `500`: PDF generation error

**Source**: `app/api/requests/[id]/pdf/route.ts:1`

---

#### `PATCH /api/requests/[id]/update-whatsapp-status`

**Description**: Update WhatsApp delivery status (called by n8n webhook)

**Authentication**: None (webhook endpoint)

**URL Parameters**:

- `id`: UUID of the request

**Request Body**:

```json
{
  "status": "sent",
  "whatsapp_sent_at": "2025-10-19T10:30:00Z"
}
```

**Response** (200 OK):

```json
{
  "message": "WhatsApp status updated successfully"
}
```

**Errors**:

- `400`: Missing required fields
- `404`: Request not found
- `500`: Database error

**Source**: `app/api/requests/[id]/update-whatsapp-status/route.ts:1`

---

### Request Items Endpoints

#### `GET /api/requests/[id]/items`

**Description**: Get all items for a service request

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the request

**Response** (200 OK):

```json
{
  "items": [
    {
      "id": "uuid",
      "request_id": "uuid",
      "section": "repair",
      "label": "Engine oil change",
      "price_paise": 15000,
      "is_suggested": true,
      "created_at": "2025-10-19T09:00:00Z"
    }
  ]
}
```

**Errors**:

- `401`: Missing or invalid JWT token
- `404`: Request not found
- `500`: Database error

**Source**: `app/api/requests/[id]/items/route.ts:1`

---

#### `POST /api/requests/[id]/items`

**Description**: Add a new item to a service request

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the request

**Request Body**:

```json
{
  "section": "repair",
  "label": "Brake pad replacement",
  "price_paise": 12000,
  "is_suggested": false
}
```

**Response** (201 Created):

```json
{
  "id": "uuid",
  "request_id": "uuid",
  "section": "repair",
  "label": "Brake pad replacement",
  "price_paise": 12000,
  "is_suggested": false,
  "created_at": "2025-10-19T11:00:00Z"
}
```

**Errors**:

- `400`: Validation failed
- `401`: Missing or invalid JWT token
- `404`: Request not found
- `500`: Database error

**Source**: `app/api/requests/[id]/items/route.ts:1`

---

#### `PATCH /api/requests/[id]/items/[itemId]`

**Description**: Update a request item

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the request
- `itemId`: UUID of the item

**Request Body** (partial update allowed):

```json
{
  "label": "Brake pad replacement (front)",
  "price_paise": 15000
}
```

**Response** (200 OK):

```json
{
  "id": "uuid",
  "message": "Item updated successfully"
  /* Updated item object */
}
```

**Errors**:

- `400`: Validation failed
- `401`: Missing or invalid JWT token
- `404`: Item not found
- `500`: Database error

**Source**: `app/api/requests/[id]/items/[itemId]/route.ts:1`

---

#### `DELETE /api/requests/[id]/items/[itemId]`

**Description**: Delete a request item

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the request
- `itemId`: UUID of the item

**Response** (200 OK):

```json
{
  "message": "Item deleted successfully"
}
```

**Errors**:

- `401`: Missing or invalid JWT token
- `404`: Item not found
- `500`: Database error

**Source**: `app/api/requests/[id]/items/[itemId]/route.ts:1`

---

### Request Notes Endpoints

#### `GET /api/requests/[id]/notes`

**Description**: Get all internal notes for a service request

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the request

**Response** (200 OK):

```json
{
  "notes": [
    {
      "id": "uuid",
      "request_id": "uuid",
      "note": "Customer requested urgent service",
      "created_at": "2025-10-19T09:15:00Z",
      "updated_at": "2025-10-19T09:15:00Z"
    }
  ]
}
```

**Errors**:

- `401`: Missing or invalid JWT token
- `404`: Request not found
- `500`: Database error

**Source**: `app/api/requests/[id]/notes/route.ts:1`

---

#### `POST /api/requests/[id]/notes`

**Description**: Add a new note to a service request

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the request

**Request Body**:

```json
{
  "note": "Customer called to confirm pickup time"
}
```

**Response** (201 Created):

```json
{
  "id": "uuid",
  "request_id": "uuid",
  "note": "Customer called to confirm pickup time",
  "created_at": "2025-10-19T11:00:00Z",
  "updated_at": "2025-10-19T11:00:00Z"
}
```

**Errors**:

- `400`: Missing note content
- `401`: Missing or invalid JWT token
- `404`: Request not found
- `500`: Database error

**Source**: `app/api/requests/[id]/notes/route.ts:1`

---

#### `PATCH /api/requests/[id]/notes/[noteId]`

**Description**: Update a note

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the request
- `noteId`: UUID of the note

**Request Body**:

```json
{
  "note": "Customer confirmed pickup at 3 PM"
}
```

**Response** (200 OK):

```json
{
  "id": "uuid",
  "message": "Note updated successfully"
  /* Updated note object */
}
```

**Errors**:

- `400`: Missing note content
- `401`: Missing or invalid JWT token
- `404`: Note not found
- `500`: Database error

**Source**: `app/api/requests/[id]/notes/[noteId]/route.ts:1`

---

#### `DELETE /api/requests/[id]/notes/[noteId]`

**Description**: Delete a note

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the request
- `noteId`: UUID of the note

**Response** (200 OK):

```json
{
  "message": "Note deleted successfully"
}
```

**Errors**:

- `401`: Missing or invalid JWT token
- `404`: Note not found
- `500`: Database error

**Source**: `app/api/requests/[id]/notes/[noteId]/route.ts:1`

---

### Add-ons Endpoints

#### `GET /api/admin/addons`

**Description**: Get all add-ons (admin view, includes inactive)

**Authentication**: Required (admin)

**Response** (200 OK):

```json
[
  {
    "id": "uuid",
    "name": "Premium wash",
    "description": "Deep cleaning with wax",
    "price_paise": 50000,
    "display_order": 1,
    "is_active": true,
    "created_at": "2025-10-15T10:00:00Z",
    "updated_at": "2025-10-15T10:00:00Z"
  }
]
```

**Errors**:

- `401`: Missing or invalid JWT token
- `500`: Database error

**Source**: `app/api/admin/addons/route.ts:5`

---

#### `POST /api/admin/addons`

**Description**: Create a new add-on

**Authentication**: Required (admin)

**Request Body**:

```json
{
  "name": "Premium wash",
  "description": "Deep cleaning with wax",
  "price_paise": 50000
}
```

**Response** (201 Created):

```json
{
  "id": "uuid",
  "name": "Premium wash",
  "description": "Deep cleaning with wax",
  "price_paise": 50000,
  "display_order": 5,
  "is_active": true,
  "created_at": "2025-10-19T11:00:00Z",
  "updated_at": "2025-10-19T11:00:00Z"
}
```

**Errors**:

- `400`: Missing name or price
- `401`: Missing or invalid JWT token
- `500`: Database error

**Source**: `app/api/admin/addons/route.ts:25`

---

#### `GET /api/admin/addons/[id]`

**Description**: Get a single add-on by ID

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the add-on

**Response** (200 OK):

```json
{
  "id": "uuid",
  "name": "Premium wash",
  "description": "Deep cleaning with wax",
  "price_paise": 50000,
  "display_order": 1,
  "is_active": true,
  "created_at": "2025-10-15T10:00:00Z",
  "updated_at": "2025-10-15T10:00:00Z"
}
```

**Errors**:

- `401`: Missing or invalid JWT token
- `404`: Add-on not found
- `500`: Database error

**Source**: `app/api/admin/addons/[id]/route.ts:1`

---

#### `PATCH /api/admin/addons/[id]`

**Description**: Update an add-on

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the add-on

**Request Body** (partial update allowed):

```json
{
  "name": "Premium wash & wax",
  "price_paise": 55000,
  "is_active": false
}
```

**Response** (200 OK):

```json
{
  "id": "uuid",
  "message": "Add-on updated successfully"
  /* Updated addon object */
}
```

**Errors**:

- `401`: Missing or invalid JWT token
- `404`: Add-on not found
- `500`: Database error

**Source**: `app/api/admin/addons/[id]/route.ts:1`

---

#### `DELETE /api/admin/addons/[id]`

**Description**: Delete an add-on

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the add-on

**Response** (200 OK):

```json
{
  "message": "Add-on deleted successfully"
}
```

**Errors**:

- `401`: Missing or invalid JWT token
- `404`: Add-on not found
- `500`: Database error

**Source**: `app/api/admin/addons/[id]/route.ts:1`

---

#### `GET /api/addons` (Public)

**Description**: Get all active add-ons (customer-facing)

**Authentication**: None (public)

**Response** (200 OK):

```json
[
  {
    "id": "uuid",
    "name": "Premium wash",
    "description": "Deep cleaning with wax",
    "price_paise": 50000,
    "display_order": 1
  }
]
```

**Note**: Only returns add-ons where `is_active = true`

**Errors**:

- `500`: Database error

**Source**: `app/api/addons/route.ts:1`

---

### Bundles Endpoints

#### `GET /api/admin/bundles`

**Description**: Get all bundles (admin view, includes inactive)

**Authentication**: Required (admin)

**Response** (200 OK):

```json
[
  {
    "id": "uuid",
    "name": "Basic Service Package",
    "description": "Essential maintenance services",
    "price_paise": 250000,
    "display_order": 1,
    "is_active": true,
    "created_at": "2025-10-15T10:00:00Z",
    "updated_at": "2025-10-15T10:00:00Z"
  }
]
```

**Errors**:

- `401`: Missing or invalid JWT token
- `500`: Database error

**Source**: `app/api/admin/bundles/route.ts:1`

---

#### `POST /api/admin/bundles`

**Description**: Create a new bundle

**Authentication**: Required (admin)

**Request Body**:

```json
{
  "name": "Basic Service Package",
  "description": "Essential maintenance services",
  "price_paise": 250000
}
```

**Response** (201 Created):

```json
{
  "id": "uuid",
  "name": "Basic Service Package",
  "description": "Essential maintenance services",
  "price_paise": 250000,
  "display_order": 3,
  "is_active": true,
  "created_at": "2025-10-19T11:00:00Z",
  "updated_at": "2025-10-19T11:00:00Z"
}
```

**Errors**:

- `400`: Missing name or price
- `401`: Missing or invalid JWT token
- `500`: Database error

**Source**: `app/api/admin/bundles/route.ts:1`

---

#### `GET /api/admin/bundles/[id]`

**Description**: Get a single bundle by ID

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the bundle

**Response** (200 OK):

```json
{
  "id": "uuid",
  "name": "Basic Service Package",
  "description": "Essential maintenance services",
  "price_paise": 250000,
  "display_order": 1,
  "is_active": true,
  "created_at": "2025-10-15T10:00:00Z",
  "updated_at": "2025-10-15T10:00:00Z"
}
```

**Errors**:

- `401`: Missing or invalid JWT token
- `404`: Bundle not found
- `500`: Database error

**Source**: `app/api/admin/bundles/[id]/route.ts:1`

---

#### `PATCH /api/admin/bundles/[id]`

**Description**: Update a bundle

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the bundle

**Request Body** (partial update allowed):

```json
{
  "name": "Premium Service Package",
  "price_paise": 350000,
  "is_active": true
}
```

**Response** (200 OK):

```json
{
  "id": "uuid",
  "message": "Bundle updated successfully"
  /* Updated bundle object */
}
```

**Errors**:

- `401`: Missing or invalid JWT token
- `404`: Bundle not found
- `500`: Database error

**Source**: `app/api/admin/bundles/[id]/route.ts:1`

---

#### `DELETE /api/admin/bundles/[id]`

**Description**: Delete a bundle

**Authentication**: Required (admin)

**URL Parameters**:

- `id`: UUID of the bundle

**Response** (200 OK):

```json
{
  "message": "Bundle deleted successfully"
}
```

**Errors**:

- `401`: Missing or invalid JWT token
- `404`: Bundle not found
- `500`: Database error

**Source**: `app/api/admin/bundles/[id]/route.ts:1`

---

#### `GET /api/bundles` (Public)

**Description**: Get all active bundles (customer-facing)

**Authentication**: None (public)

**Response** (200 OK):

```json
[
  {
    "id": "uuid",
    "name": "Basic Service Package",
    "description": "Essential maintenance services",
    "price_paise": 250000,
    "display_order": 1
  }
]
```

**Note**: Only returns bundles where `is_active = true`

**Errors**:

- `500`: Database error

**Source**: `app/api/bundles/route.ts:1`

---

### La Carte Endpoints

#### `GET /api/admin/lacarte`

**Description**: Get La Carte pricing settings

**Authentication**: Required (admin)

**Response** (200 OK):

```json
{
  "base_price_paise": 150000,
  "discount_percentage": 10,
  "is_active": true,
  "description": "Base service pricing with 10% discount"
}
```

**Errors**:

- `401`: Missing or invalid JWT token
- `500`: Database error

**Source**: `app/api/admin/lacarte/route.ts:1`

---

#### `PATCH /api/admin/lacarte`

**Description**: Update La Carte pricing settings

**Authentication**: Required (admin)

**Request Body**:

```json
{
  "base_price_paise": 160000,
  "discount_percentage": 15,
  "is_active": true
}
```

**Response** (200 OK):

```json
{
  "message": "La Carte settings updated successfully",
  "base_price_paise": 160000,
  "discount_percentage": 15,
  "is_active": true
}
```

**Errors**:

- `400`: Invalid pricing values
- `401`: Missing or invalid JWT token
- `500`: Database error

**Source**: `app/api/admin/lacarte/route.ts:1`

---

### Analytics Endpoints

#### `GET /api/analytics`

**Description**: Get analytics data and metrics

**Authentication**: Required (admin)

**Query Parameters**:

| Parameter    | Type                | Default     | Description                                                          |
| ------------ | ------------------- | ----------- | -------------------------------------------------------------------- |
| `start_date` | string (YYYY-MM-DD) | 30 days ago | Start date for analytics                                             |
| `end_date`   | string (YYYY-MM-DD) | Today       | End date for analytics                                               |
| `metric`     | string              | all         | Specific metric to fetch: `revenue`, `requests`, `conversion`, `all` |

**Response** (200 OK):

```json
{
  "revenue": {
    "total_paise": 5500000,
    "average_per_request_paise": 183333,
    "by_status": {
      "confirmed": 4500000,
      "sent": 1000000
    }
  },
  "requests": {
    "total": 30,
    "by_status": {
      "pending": 5,
      "sent": 10,
      "viewed": 8,
      "confirmed": 6,
      "cancelled": 1
    }
  },
  "conversion": {
    "sent_to_viewed": 0.8,
    "viewed_to_confirmed": 0.75,
    "overall": 0.6
  },
  "trends": {
    "daily_revenue": [
      /* Array of {date, revenue_paise} */
    ],
    "daily_requests": [
      /* Array of {date, count} */
    ]
  }
}
```

**Errors**:

- `401`: Missing or invalid JWT token
- `400`: Invalid date format
- `500`: Database error

**Source**: `app/api/analytics/route.ts:1`

---

### Public APIs

#### `GET /api/public/lookup`

**Description**: Lookup orders by phone number or order ID

**Authentication**: None (public)

**Query Parameters**:

| Parameter  | Type   | Description                 |
| ---------- | ------ | --------------------------- |
| `phone`    | string | Phone number (10-15 digits) |
| `order_id` | string | Order ID (ORD-XXX)          |

**Note**: Must provide either `phone` OR `order_id`

**Response** (200 OK):

```json
{
  "orders": [
    {
      "id": "uuid",
      "order_id": "ORD-001",
      "short_slug": "abc123",
      "bike_name": "Royal Enfield Classic 350",
      "status": "sent",
      "created_at": "2025-10-19T09:00:00Z"
    }
  ]
}
```

**Errors**:

- `400`: Missing search parameter
- `404`: No orders found
- `500`: Database error

**Source**: `app/api/public/lookup/route.ts:1`

---

#### `GET /api/public/orders/[slug]`

**Description**: Get order details by short slug (customer view)

**Authentication**: None (public)

**URL Parameters**:

- `slug`: Short slug (e.g., `abc123`)

**Response** (200 OK):

```json
{
  "id": "uuid",
  "order_id": "ORD-001",
  "customer_name": "John Doe",
  "bike_name": "Royal Enfield Classic 350",
  "status": "sent",
  "lacarte_paise": 150000,
  "total_paise": 175000,
  "request_items": [
    {
      "id": "uuid",
      "section": "repair",
      "label": "Engine oil change",
      "price_paise": 15000,
      "is_suggested": true
    }
  ],
  "created_at": "2025-10-19T09:00:00Z"
}
```

**Note**: Excludes sensitive fields like notes, internal timestamps

**Errors**:

- `404`: Order not found
- `500`: Database error

**Source**: `app/api/public/orders/[slug]/route.ts:1`

---

#### `POST /api/public/orders/[slug]/view`

**Description**: Mark order as viewed or confirmed (customer action)

**Authentication**: None (public)

**URL Parameters**:

- `slug`: Short slug (e.g., `abc123`)

**Request Body**:

```json
{
  "status": "viewed",
  "selected_items": ["item-uuid-1", "item-uuid-2"],
  "selected_addons": ["addon-uuid-1"],
  "selected_bundles": []
}
```

**Validation**:

- `status`: Must be `viewed` or `confirmed`
- `selected_items`: Array of item UUIDs (optional)
- `selected_addons`: Array of addon UUIDs (optional)
- `selected_bundles`: Array of bundle UUIDs (optional)

**Response** (200 OK):

```json
{
  "message": "Order marked as viewed successfully",
  "status": "viewed",
  "total_paise": 175000
}
```

**Errors**:

- `400`: Invalid status or validation failed
- `404`: Order not found
- `500`: Database error

**Source**: `app/api/public/orders/[slug]/view/route.ts:1`

---

### Webhooks

#### `POST /api/webhooks/send-whatsapp`

**Description**: Send WhatsApp message via n8n webhook

**Authentication**: None (internal webhook)

**Request Body**:

```json
{
  "phone": "919876543210",
  "message": "Hello from CycleBees!",
  "template_name": "service_estimate",
  "template_params": {
    "customer_name": "John Doe",
    "order_id": "ORD-001",
    "total": "₹1,750"
  }
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "WhatsApp message sent successfully",
  "n8n_response": {
    /* n8n webhook response */
  }
}
```

**Errors**:

- `400`: Missing phone or message
- `500`: n8n webhook error, network error

**Source**: `app/api/webhooks/send-whatsapp/route.ts:1`

**n8n Webhook URL**: Configured via `N8N_WEBHOOK_URL` environment variable

---

## Schemas

### Request Schema

```typescript
{
  order_id: string (1-100 chars)
  bike_name: string (1-200 chars)
  customer_name: string (1-200 chars)
  phone_digits_intl: string (10-15 digits, auto-adds 91 prefix)
  status: "pending" | "sent" | "viewed" | "confirmed" | "cancelled"
  lacarte_paise?: number (0-10,000,000, nullable)
}
```

### Request Item Schema

```typescript
{
  section: "repair" | "replacement"
  label: string (1-500 chars)
  price_paise: number (1-10,000,000)
  is_suggested: boolean
}
```

### Customer Order Schema

```typescript
{
  selected_items: string[] (array of UUIDs)
  selected_addons?: string[] (array of UUIDs)
  selected_bundles?: string[] (array of UUIDs)
  status?: "viewed" | "confirmed"
}
```

**Validation Source**: `lib/validations.ts:1`

---

## Status Codes

### HTTP Status Codes Used

- **200 OK**: Successful GET, PATCH, DELETE request
- **201 Created**: Successful POST request (resource created)
- **400 Bad Request**: Validation error, missing required fields
- **401 Unauthorized**: Missing or invalid JWT token, wrong credentials
- **403 Forbidden**: Valid token but insufficient permissions (not currently
  used)
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Database error, unexpected server issue

---

## Pricing Convention

**All prices are stored in paise (Indian currency)**:

- 1 Rupee = 100 paise
- Example: ₹1,500.00 = 150000 paise

**Price Fields**:

- `price_paise`: Item price
- `lacarte_paise`: La Carte base service price
- `total_paise`: Calculated total (auto-updated by database trigger)

**Utility Function**: `formatCurrency()` in `lib/utils.ts:1` converts paise to
formatted rupees.

---

## Rate Limiting

**Status**: Not implemented yet

**Planned**: API rate limiting with `@upstash/ratelimit` (see PROJECT_TRACKER.md
Phase 6)

---

## CORS

**Status**: Not configured (Next.js defaults)

**Same-origin only**: API endpoints are designed for same-origin requests from
the Next.js frontend.

---

## Versioning

**Current Version**: 1.0.0 (unversioned API endpoints)

**Future**: Consider adding `/api/v1/` prefix when breaking changes are
introduced.

---

## Additional Resources

- **Database Schema**: See `docs/DATABASE.md`
- **Architecture Decisions**: See `docs/ARCHITECTURE.md`
- **Deployment Guide**: See `docs/DEPLOYMENT_GUIDE.md`
- **Testing Guide**: See `docs/TESTING_GUIDE.md`
- **WhatsApp Integration**: See `docs/WEBHOOK_DOCUMENTATION.md`

---

**Last Updated**: 2025-10-19 **Maintained By**: CycleBees Development Team
