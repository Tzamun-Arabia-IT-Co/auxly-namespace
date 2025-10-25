# OAuth Setup Guide

This guide explains how to configure GitHub and Google OAuth for the Auxly landing page.

## Prerequisites

- Backend running on `http://localhost:7000`
- Frontend running on `http://localhost:5173`
- PostgreSQL database configured

## Environment Variables

Add these variables to your `backend/.env` file:

```env
# Backend URL (where your API is running)
BACKEND_URL=http://localhost:7000

# Frontend URL (where your React app is running)
FRONTEND_URL=http://localhost:5173

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 1. GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name:** Auxly
   - **Homepage URL:** `http://localhost:7000`
   - **Authorization callback URL:** `http://localhost:7000/auth/github/callback`
4. Click "Register application"

### Step 2: Get Credentials

1. After creating the app, you'll see your **Client ID**
2. Click "Generate a new client secret" to get your **Client Secret**
3. Copy both values to your `.env` file:

```env
GITHUB_CLIENT_ID=abc123def456
GITHUB_CLIENT_SECRET=secret789xyz
```

### Step 3: Update for Production

When deploying to production, create a new OAuth app with:
- **Homepage URL:** `https://yourdomain.com`
- **Authorization callback URL:** `https://api.yourdomain.com/auth/github/callback`

## 2. Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable the **Google+ API**

### Step 2: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Fill in the details:
   - **Name:** Auxly
   - **Authorized JavaScript origins:** `http://localhost:7000`
   - **Authorized redirect URIs:** `http://localhost:7000/auth/google/callback`
5. Click "Create"

### Step 3: Get Credentials

1. Copy the **Client ID** and **Client Secret**
2. Add them to your `.env` file:

```env
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdef123456
```

### Step 4: Update for Production

When deploying to production:
- **Authorized JavaScript origins:** `https://yourdomain.com`, `https://api.yourdomain.com`
- **Authorized redirect URIs:** `https://api.yourdomain.com/auth/google/callback`

## 3. Database Migration

Run the migration to add OAuth fields to the database:

```bash
cd backend
npm run migrate:up
```

This adds:
- `oauth_provider` column (e.g., 'github', 'google')
- `oauth_id` column (provider's user ID)
- Makes `password` column nullable (OAuth users don't need passwords)

## 4. Testing OAuth Flow

### Test GitHub OAuth

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd web/auxly-landing && npm run dev`
3. Go to `http://localhost:5173/signup`
4. Click "Continue with GitHub"
5. Authorize the app
6. You should be redirected to the dashboard with an API key

### Test Google OAuth

1. Follow the same steps but click "Continue with Google"
2. Select your Google account
3. Authorize the app
4. You should be redirected to the dashboard

## OAuth Flow Diagram

```
Frontend (React) → Backend (Express) → OAuth Provider → Backend → Frontend

1. User clicks "Continue with GitHub/Google"
2. Frontend redirects to: http://localhost:7000/auth/github (or /google)
3. Backend redirects to OAuth provider's authorization page
4. User authorizes the app
5. OAuth provider redirects back to: http://localhost:7000/auth/github/callback
6. Backend creates/finds user, generates JWT token
7. Backend redirects to: http://localhost:5173/auth/callback?token=xyz&email=user@example.com
8. Frontend stores token in localStorage
9. Frontend redirects to /dashboard
```

## Troubleshooting

### "Redirect URI mismatch" Error

- Make sure the callback URL in your OAuth app settings matches exactly
- Check that BACKEND_URL in .env is correct
- Ensure no trailing slashes in URLs

### "Email not found" Error (Google)

- Make sure Google+ API is enabled
- Request 'email' scope in the OAuth flow

### "User already exists" Issue

- OAuth login will automatically link to existing accounts by email
- GitHub users without public email will get `username@github.com`

## Security Notes

- Never commit `.env` file with real credentials
- Use different OAuth apps for development and production
- Rotate secrets regularly
- Enable 2FA on your OAuth provider accounts

