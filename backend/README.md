# Auxly Backend API

Backend API server for Auxly - AI Task Manager Extension with subscription platform.

## Features

- ✅ User authentication (register, login, JWT)
- ✅ API key management (generate, list, revoke, validate)
- ✅ Stripe subscription integration (webhooks, status)
- ✅ Tier-based feature access (free, pro, team)
- ✅ PostgreSQL database with migrations
- ✅ Password hashing with bcrypt
- ✅ Secure API key generation with crypto.randomBytes
- ✅ Rate limiting per subscription tier
- ✅ Security headers with Helmet
- ✅ CORS configuration
- ✅ TypeScript support

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express 5
- **Database**: PostgreSQL
- **Auth**: JWT + bcrypt
- **Security**: Helmet, express-rate-limit, CORS
- **Migrations**: node-pg-migrate

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Auxly
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_POOL_MIN=2
DB_POOL_MAX=10

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-256-bits

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 3. Run Database Migrations

```bash
npm run migrate:up
```

### 4. Initialize Database (Optional)

```bash
npm run db:init
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:7000`

## API Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-11T00:00:00.000Z",
  "service": "Auxly Backend API"
}
```

### Authentication

#### Register User

```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-10-11T00:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": "User already exists"
}
```

#### Login

```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-10-11T00:00:00.000Z"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

#### Verify Token

```
GET /auth/verify
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "message": "Token is valid",
  "user": {
    "userId": 1,
    "email": "user@example.com"
  }
}
```

#### Get Current User

```
GET /auth/me
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "user": {
    "userId": 1,
    "email": "user@example.com"
  }
}
```

## Security Features

### Rate Limiting

Authentication endpoints are rate-limited to **5 requests per 15 minutes** per IP address to prevent brute force attacks.

### Password Requirements

- Minimum 8 characters
- Hashed with bcrypt (12 salt rounds)

### JWT Tokens

- Expire in 24 hours
- Signed with HS256 algorithm
- Include minimal claims (userId, email)

### HTTP Security Headers

Helmet middleware adds the following security headers:
- Content-Security-Policy
- X-DNS-Prefetch-Control
- X-Frame-Options
- X-Content-Type-Options
- And more...

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_tier VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── connection.ts    # Database pool and query helpers
│   │   └── init.ts          # Database initialization
│   ├── middleware/
│   │   └── auth.ts          # JWT authentication middleware
│   ├── routes/
│   │   └── auth.ts          # Authentication endpoints
│   ├── services/
│   │   └── auth.ts          # Authentication business logic
│   ├── types/
│   │   └── database.ts      # TypeScript type definitions
│   └── index.ts             # Express server entry point
├── migrations/              # Database migrations
├── package.json
├── tsconfig.json
└── README.md
```

## Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run migrate:up` - Run database migrations
- `npm run migrate:down` - Rollback last migration
- `npm run migrate:create <name>` - Create new migration
- `npm run db:init` - Initialize database

## Testing

You can test the API using:
- **Thunder Client** (VS Code extension)
- **Postman**
- **cURL**

Example cURL commands:

```bash
# Register
curl -X POST http://localhost:7000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:7000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Verify token (replace <TOKEN> with actual token)
curl -X GET http://localhost:7000/auth/verify \
  -H "Authorization: Bearer <TOKEN>"
```

### API Key Management

#### Generate API Key

```
POST /api-keys/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "My Extension Key" (optional)
}
```

**Success Response (201):**
```json
{
  "message": "API key generated successfully",
  "api_key": "auxly_f4a8d2c1e9b3a7d6e2f8c4b9a1d7e3f6c2b8a4d9e1f7c3b6a2d8e4f1c7b3a9d6e2",
  "key_info": {
    "id": 1,
    "masked_key": "auxly_f4a...9d6e2",
    "name": "My Extension Key",
    "created_at": "2025-10-11T00:00:00.000Z"
  },
  "warning": "Save this key securely. You will not be able to see it again."
}
```

#### List API Keys

```
GET /api-keys/list
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "keys": [
    {
      "id": 1,
      "masked_key": "auxly_***...***",
      "name": "My Extension Key",
      "last_used": "2025-10-11T12:30:00.000Z",
      "revoked": false,
      "created_at": "2025-10-11T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Revoke API Key

```
DELETE /api-keys/:id
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "message": "API key revoked successfully"
}
```

#### Verify API Key

```
GET /api-keys/verify
Authorization: Bearer <api_key>
or
X-API-Key: <api_key>
```

**Success Response (200):**
```json
{
  "message": "API key is valid",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "subscription": {
      "plan_tier": "free",
      "status": "active"
    }
  }
}
```

**Rate Limit Response (429):**
```json
{
  "error": "Rate limit exceeded",
  "usage_count": 50,
  "limit": 50,
  "message": "You have used 50/50 requests this month. Upgrade to Pro for unlimited access."
}
```

## API Key Format

API keys follow the format: `auxly_[64 hex characters]`

Example: `auxly_f4a8d2c1e9b3a7d6e2f8c4b9a1d7e3f6c2b8a4d9e1f7c3b6a2d8e4f1c7b3a9d6e2`

- **Prefix**: `auxly_` (for easy identification)
- **Random Part**: 32 bytes = 64 hex characters
- **Total Length**: 70 characters
- **Entropy**: 256 bits (cryptographically secure)

## Rate Limiting

Rate limits are enforced based on subscription tier:

| Tier | Monthly Limit |
|------|--------------|
| Free | 50 requests |
| Pro  | Unlimited |
| Team | Unlimited |

### Stripe & Subscriptions

#### Get Subscription Status

```
GET /subscription/status
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "subscription": {
    "plan_tier": "pro",
    "status": "active",
    "current_period_end": "2025-11-11T00:00:00.000Z",
    "features": {
      "tasks_per_month": null,
      "workspaces": null,
      "history_days": 30,
      "priority_support": true
    }
  }
}
```

#### Get Usage Limits

```
GET /subscription/limits
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "limits": {
    "tasks_per_month": null,
    "workspaces": null,
    "history_days": 30
  }
}
```

#### Get Available Tiers

```
GET /subscription/tiers
(No authentication required)
```

**Success Response (200):**
```json
{
  "tiers": [
    {
      "id": "free",
      "name": "Free",
      "price": 0,
      "features": {
        "tasks_per_month": 50,
        "workspaces": 1,
        "history_days": 7
      }
    },
    {
      "id": "pro",
      "name": "Pro",
      "price": 9,
      "features": {
        "tasks_per_month": null,
        "workspaces": null,
        "history_days": 30,
        "priority_support": true
      }
    },
    {
      "id": "team",
      "name": "Team",
      "price": 29,
      "features": {
        "tasks_per_month": null,
        "workspaces": null,
        "history_days": null,
        "team_features": true,
        "priority_support": true
      }
    }
  ]
}
```

#### Stripe Webhook

```
POST /stripe/webhook
Stripe-Signature: <signature>
(Raw body - handled automatically)
```

**Handled Events:**
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Plan change/renewal
- `customer.subscription.deleted` - Cancellation
- `invoice.payment_failed` - Payment failure
- `invoice.payment_succeeded` - Payment success

**Success Response (200):**
```json
{
  "received": true,
  "event_type": "customer.subscription.created"
}
```

## Subscription Tiers

| Feature | Free | Pro ($9/mo) | Team ($29/mo) |
|---------|------|-------------|---------------|
| Tasks/Month | 50 | Unlimited | Unlimited |
| Workspaces | 1 | Unlimited | Unlimited |
| History | 7 days | 30 days | Unlimited |
| Priority Support | ❌ | ✅ | ✅ |
| Team Features | ❌ | ❌ | ✅ |

## Stripe Integration

The backend integrates with Stripe for subscription management:

1. **Webhook Processing**: Automatically updates subscription status from Stripe events
2. **Signature Verification**: All webhooks are verified using Stripe signatures
3. **Idempotent Processing**: Duplicate events are handled gracefully
4. **Tier Mapping**: Stripe price IDs are mapped to internal tier names
5. **Status Synchronization**: Subscription status is kept in sync with Stripe

### Testing Webhooks Locally

Use Stripe CLI to forward webhooks to your local server:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:7000/stripe/webhook

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

## Next Steps
- [ ] Add refresh token functionality
- [ ] Implement password reset flow
- [ ] Add email verification
- [ ] Create admin endpoints
- [ ] Add comprehensive test suite

## License

ISC

