# 🧪 Auxly API Testing Guide

Complete guide for testing all Auxly backend API endpoints.

## 🚀 Quick Start

### Option 1: Interactive HTML Testing Interface (Recommended)
Open `test-api.html` in your browser:
```bash
# From backend directory
open test-api.html
# Or just double-click the file
```

### Option 2: cURL Commands
Use the examples below to test each endpoint from your terminal.

---

## 📍 Base URL

```
http://localhost:7000
```

---

## 🔐 Authentication Endpoints

### 1. Register New User

**Endpoint:** `POST /auth/register`

**Request:**
```bash
curl -X POST http://localhost:7000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Email and password are required"
}
```

---

### 2. Login

**Endpoint:** `POST /auth/login`

**Request:**
```bash
curl -X POST http://localhost:7000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

### 3. Verify Token

**Endpoint:** `GET /auth/verify`

**Request:**
```bash
# Replace YOUR_JWT_TOKEN with actual token from login/register
curl http://localhost:7000/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "email": "test@example.com"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid or expired token"
}
```

---

## 🔑 API Key Management

### 1. Generate API Key

**Endpoint:** `POST /api-keys/generate`

**Request:**
```bash
curl -X POST http://localhost:7000/api-keys/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Development Key"
  }'
```

**Success Response (201):**
```json
{
  "message": "API key generated successfully",
  "key": "auxly_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
  "keyInfo": {
    "id": 1,
    "name": "My Development Key",
    "masked_key": "auxly_...e1f2",
    "created_at": "2025-10-10T22:00:00.000Z"
  }
}
```

⚠️ **IMPORTANT:** Save the `key` value immediately - it won't be shown again!

---

### 2. List All API Keys

**Endpoint:** `GET /api-keys/list`

**Request:**
```bash
curl http://localhost:7000/api-keys/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "keys": [
    {
      "id": 1,
      "name": "My Development Key",
      "masked_key": "auxly_...e1f2",
      "last_used": "2025-10-10T22:15:00.000Z",
      "revoked": false,
      "created_at": "2025-10-10T22:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Production Key",
      "masked_key": "auxly_...x9y0",
      "last_used": null,
      "revoked": false,
      "created_at": "2025-10-10T22:05:00.000Z"
    }
  ]
}
```

---

### 3. Revoke API Key

**Endpoint:** `POST /api-keys/revoke`

**Request:**
```bash
curl -X POST http://localhost:7000/api-keys/revoke \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keyId": 1
  }'
```

**Success Response (200):**
```json
{
  "message": "API key revoked successfully"
}
```

---

### 4. Verify API Key

**Endpoint:** `POST /api-keys/verify`

**Request:**
```bash
curl -X POST http://localhost:7000/api-keys/verify \
  -H "Content-Type: application/json" \
  -d '{
    "key": "auxly_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
  }'
```

**Success Response (200):**
```json
{
  "valid": true,
  "keyInfo": {
    "id": 1,
    "user_id": 1,
    "name": "My Development Key",
    "masked_key": "auxly_...e1f2",
    "last_used": "2025-10-10T22:30:00.000Z"
  }
}
```

**Error Response (401):**
```json
{
  "valid": false,
  "error": "Invalid or revoked API key"
}
```

---

## 💳 Subscription & Usage

### 1. Get Subscription Status

**Endpoint:** `GET /subscription/status`

**Request:**
```bash
curl http://localhost:7000/subscription/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "subscription": {
    "id": 1,
    "user_id": 1,
    "plan_tier": "free",
    "status": "active",
    "stripe_subscription_id": null,
    "stripe_customer_id": null,
    "current_period_end": null,
    "created_at": "2025-10-10T22:00:00.000Z",
    "updated_at": "2025-10-10T22:00:00.000Z"
  }
}
```

---

### 2. Get Usage Limits

**Endpoint:** `GET /subscription/usage`

**Request:**
```bash
curl http://localhost:7000/subscription/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "plan_tier": "free",
  "status": "active",
  "limits": {
    "taskManagerEnabled": true,
    "maxTasks": 100,
    "contextualRules": false,
    "advancedWorkflows": false,
    "prioritySupport": false,
    "analytics": false
  }
}
```

---

### 3. Get Available Tiers

**Endpoint:** `GET /subscription/tiers`

**Request:**
```bash
curl http://localhost:7000/subscription/tiers
```

**Success Response (200):**
```json
{
  "tiers": [
    {
      "tier": "free",
      "name": "Free",
      "price": 0,
      "features": [
        "Task Manager - 100 tasks",
        "Basic Cursor rules",
        "Community support"
      ]
    },
    {
      "tier": "pro",
      "name": "Pro",
      "price": 15,
      "features": [
        "Task Manager - Unlimited tasks",
        "Contextual rules generation",
        "Advanced workflows",
        "Priority support",
        "Analytics & insights"
      ]
    },
    {
      "tier": "team",
      "name": "Team",
      "price": 50,
      "features": [
        "Everything in Pro",
        "Team collaboration",
        "Shared task boards",
        "Admin controls",
        "SSO integration",
        "Dedicated support"
      ]
    }
  ]
}
```

---

## ❤️ Health Check

**Endpoint:** `GET /health`

**Request:**
```bash
curl http://localhost:7000/health
```

**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-10-10T22:00:00.000Z",
  "service": "Auxly Backend API"
}
```

---

## 🔄 Complete Testing Flow

### Step 1: Register a new user
```bash
curl -X POST http://localhost:7000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@auxly.dev", "password": "TestPass123!"}'
```

**Save the returned `token` for next steps!**

### Step 2: Generate an API key
```bash
curl -X POST http://localhost:7000/api-keys/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Key"}'
```

**Save the returned `key` immediately!**

### Step 3: Verify the API key
```bash
curl -X POST http://localhost:7000/api-keys/verify \
  -H "Content-Type: application/json" \
  -d '{"key": "YOUR_API_KEY"}'
```

### Step 4: Check subscription status
```bash
curl http://localhost:7000/subscription/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 5: List all API keys
```bash
curl http://localhost:7000/api-keys/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🛡️ Authentication & Authorization

### JWT Token Authentication
Most endpoints require a valid JWT token in the `Authorization` header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

**Token Lifetime:** 7 days

### API Key Authentication
Some endpoints accept API key authentication:

```bash
X-API-Key: auxly_your_api_key_here
```

---

## 📊 Rate Limiting

Rate limits vary by subscription tier:

- **Free Tier:** 100 requests/hour
- **Pro Tier:** 1,000 requests/hour  
- **Team Tier:** 10,000 requests/hour

When rate limit is exceeded:
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

---

## ❌ Common Errors

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "error": "Route not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## 🧰 Testing Tools

### Recommended Tools:
1. **Interactive HTML Interface** (included) - `test-api.html`
2. **cURL** - Command-line testing (examples above)
3. **Postman** - Import endpoints and create collections
4. **Thunder Client** - VSCode extension for API testing
5. **REST Client** - VSCode extension with `.http` files

---

## 💡 Tips

1. **Save tokens immediately** - JWT tokens and API keys are only shown once
2. **Use environment variables** - Store tokens securely, don't commit them
3. **Test in order** - Follow the complete testing flow for best results
4. **Check logs** - Server logs show detailed request/response information
5. **Clear localStorage** - Use the "Clear Storage" button in HTML interface if needed

---

## 🐛 Troubleshooting

### "CORS error"
- Ensure backend is running on `localhost:7000`
- Check browser console for specific CORS errors

### "Invalid token"
- Token may have expired (7 days)
- Generate a new token by logging in again

### "Database connection error"
- Verify PostgreSQL is running
- Check database credentials in `.env` file

### "Stripe features not working"
- Add `STRIPE_SECRET_KEY` to `.env` file
- Get test keys from Stripe dashboard

---

## 📚 Next Steps

1. ✅ Test all authentication endpoints
2. ✅ Generate and verify API keys
3. ✅ Check subscription status
4. 🚀 Build the VSCode extension
5. 🎨 Create the landing page

**Happy Testing!** 🚀















