# Backend Deployment Guide

## Environment Variables

Configure these environment variables in your deployment platform (Render, Heroku, etc.):

### Required Variables

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
```

### Optional Variables

```env
# Comma-separated list of allowed origins
# Note: All *.vercel.app domains are automatically allowed
CLIENT_ORIGIN=https://your-app.vercel.app,https://your-staging.vercel.app

# Redis (optional, for caching)
REDIS_URL=redis://your-redis-url:6379

# AI Service (optional)
AI_SERVICE_URL=https://open-learn-hub-1.onrender.com
GEMINI_API_KEY=your_gemini_api_key

# Node environment
NODE_ENV=production
```

## Render Deployment

### Configuration

1. **Root Directory**: `open-learn-hub/backend`
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. **Environment**: Node

### Environment Setup

Add the environment variables listed above in the Render dashboard under "Environment" tab.

## CORS Configuration

The backend automatically allows:
- All origins listed in `CLIENT_ORIGIN` (comma-separated)
- All `*.vercel.app` domains (for Vercel preview deployments)
- Requests with no origin (mobile apps, Postman, etc.)

This means you don't need to update environment variables for every Vercel preview deployment!

## Health Check

The backend exposes a health check endpoint:

```
GET /api/health
```

Response:
```json
{
  "ok": true
}
```

## Logs

On startup, the server logs:
- 🚀 Server port
- 📝 Environment mode
- 🌐 Allowed origins
- ✅ CORS configuration status

## Troubleshooting

### CORS Errors
- Verify `CLIENT_ORIGIN` includes your production URL
- Check that your frontend URL matches exactly (no trailing slashes)
- All `*.vercel.app` domains are automatically allowed

### Module Not Found
- Ensure `npm install` runs in the `open-learn-hub/backend` directory
- Check that `package.json` and `package-lock.json` are committed

### Database Connection
- Verify `MONGODB_URI` is set correctly
- Check MongoDB Atlas network access allows Render's IP addresses
- Ensure database user has proper permissions
