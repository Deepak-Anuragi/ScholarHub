# Scholar's Hub — Monorepo

```
ScholarHub/
├── web/      → Next.js 16 frontend  (http://localhost:3000)
└── server/   → Express API backend  (http://localhost:5000)
```

## How it works

The frontend never calls the Express server directly from the browser.
`next.config.ts` rewrites every `/api/*` request to `http://localhost:5000/api/*`
on the server side, so the browser always stays on `localhost:3000`.
This keeps `httpOnly` cookies working correctly with zero CORS issues.

```
Browser → localhost:3000/api/auth/login
                ↓ (Next.js rewrite, server-side)
        → localhost:5000/api/auth/login
```

---

## Quick start (development)

Open **two terminals**.

### Terminal 1 — API server

```bash
cd server
# First time only: copy and fill in your MongoDB URI
copy .env.example .env

npm install        # already done if you followed setup
npm start          # compiles TypeScript then runs on port 5000
```

### Terminal 2 — Frontend

```bash
cd web
# First time only: verify NEXT_PUBLIC_API_URL=http://localhost:5000
# (already set in .env.local — no MongoDB URI needed here)

npm run dev        # Next.js on port 3000
```

Then open **http://localhost:3000**.

---

## Environment variables

### `server/.env`

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `PORT` | Port to listen on (default `5000`) |
| `CLIENT_URL` | Frontend origin for CORS (default `http://localhost:3000`) |
| `RAZORPAY_KEY_ID` | Razorpay key (optional — mock payments used if blank) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret (optional) |

### `web/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Frontend URL (default `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | Express server URL (default `http://localhost:5000`) |

> **Note:** The web project no longer connects to MongoDB directly.
> All database access goes through the Express server.

---

## Production

```bash
# Server
cd server && npm start   # compiles TS → dist/, then runs node

# Frontend (set NEXT_PUBLIC_API_URL to your deployed API URL first)
cd web && npm run build && npm start
```
