# Scholar's Hub — Express API Server

Express backend for Scholar's Hub. The Next.js frontend proxies all `/api/*` requests to this server via rewrites.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev
```

The server runs on **http://localhost:5000** by default.

## Architecture

- **Port**: 5000 (configured via `PORT` env var)
- **CORS**: Allows `http://localhost:3000` (Next.js frontend)
- **Auth**: Cookie-based session (`scholars_session` cookie, decoded from base64url JSON)
- **Database**: MongoDB via Mongoose
- **Payment**: Razorpay (optional — falls back to mock for development)

## Frontend Integration

The Next.js frontend rewrites `/api/*` → `http://localhost:5000/api/*`, so:
- Frontend calls: `fetch("/api/auth/login", ...)`
- Proxied to: `http://localhost:5000/api/auth/login`
- Cookie domain is unified (localhost:3000), so httpOnly cookies work perfectly.

## Development

```bash
npm run dev   # Starts ts-node-dev on port 5000
```

## Production

```bash
npm run build  # Compiles TypeScript to dist/
npm start      # Runs compiled JS
```
