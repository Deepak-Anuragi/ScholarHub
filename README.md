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

`node_modules` is not committed, so install in both packages first.

### Terminal 1 — API server

```bash
cd server
cp .env.example .env      # then fill in MONGODB_URI and JWT_SECRET
npm install
npm run dev               # tsx watch, port 5000
```

### Terminal 2 — Frontend

```bash
cd web
cp .env.example .env.local   # JWT_SECRET must match server/.env
npm install
npm run dev                  # Next.js, port 3000
```

Then open **http://localhost:3000**.

> The server refuses to start without `JWT_SECRET`. Generate one with:
> `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

---

## Authentication

Login issues a signed JWT, stored in an `httpOnly` cookie named
`scholars_session`. Three layers read it:

| Layer | What it does |
|---|---|
| `web/src/middleware.ts` | Checks the cookie is *present* and redirects if not. A fast path, not a security boundary. |
| `web/src/lib/auth-session.ts` | `jwt.verify` in Server Components — this is what guards the dashboard layouts. |
| `server/src/middleware/auth.ts` | `jwt.verify` on every API request, plus `requireAuth` / `requireOwner` / `requireAdmin`. |

Because the frontend verifies too, `JWT_SECRET` must be identical in
`server/.env` and `web/.env.local`. The web package only ever verifies — it
never signs.

Roles are `student`, `owner` and `admin`. Admin signup additionally requires
`ADMIN_SECRET_KEY`.

---

## Environment variables

### `server/.env`

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Signs session tokens; server will not boot without it |
| `JWT_EXPIRES_IN` | no | Token lifetime, default `30d` |
| `PORT` | no | Default `5000` |
| `CLIENT_URL` | no | CORS origin(s), comma-separated. Default `http://localhost:3000` |
| `ADMIN_SECRET_KEY` | for admin signup | Without it `/api/auth/signup/admin` always returns 403 |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | in production | Blank in dev falls back to mock orders; both required in production |
| `SMTP_*` | no | Nodemailer. Unset disables email; seat alerts stay in-app |

### `web/.env.local`

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | yes | Must match `server/.env` |
| `NEXT_PUBLIC_API_URL` | no | Express origin for SSR fetches. Default `http://localhost:5000` |
| `NEXT_PUBLIC_APP_URL` | no | Default `http://localhost:3000` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | for `/map` | Restrict by HTTP referrer |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | no | Owner photo upload; blank stores a placeholder URL |

> The web project does not connect to MongoDB. All database access goes through
> the Express server.

---

## Production

```bash
# Server
cd server && npm start   # compiles TS → dist/, then runs node

# Frontend (set NEXT_PUBLIC_API_URL to your deployed API URL first)
cd web && npm run build && npm start
```
