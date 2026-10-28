<div align="center">

# 🎓 Scholar's Hub — Monorepo

### *Enterprise-Grade Study Space Booking, Library Management & EdTech Platform*

[![CI Status](https://github.com/Deepak-Anuragi/ScholarHub/actions/workflows/ci.yml/badge.svg)](https://github.com/Deepak-Anuragi/ScholarHub/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7.0--alpine-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose_Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?style=flat-square&logo=socketdotio)](https://socket.io/)
[![k6](https://img.shields.io/badge/k6-Load_Tested-7D64FF?style=flat-square&logo=k6)](https://k6.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

<br/>

<p align="center">
  <b>Bridging the gap between competitive exam aspirants and premium study libraries.</b><br/>
  Featuring real-time seat reservation, geospatial discovery, automated waitlist queues, digital QR identification, instant payment settlement, and real-time student-host messaging.
</p>

[Explore Features](#key-features) •
[System Architecture](#system-architecture) •
[Quick Start](#quick-start-guide) •
[Docker Deployment](#option-b-1-click-docker-compose) •
[API Documentation](#api-reference) •
[Engineering Deep-Dive](#engineering-highlights--security)

</div>

---

## 📑 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
  - [Student Experience](#student-experience)
  - [Library Owner Portal](#library-owner-portal)
  - [Super Admin Command Center](#super-admin-command-center)
- [Technology Stack](#technology-stack)
- [Monorepo Directory Layout](#monorepo-directory-layout)
- [Engineering Highlights & Security](#engineering-highlights--security)
  - [1. Zero-CORS Cookie Rewrite Architecture](#1-zero-cors-cookie-rewrite-architecture)
  - [2. Triple-Tier Security & RBAC Guard Pipeline](#2-triple-tier-security--rbac-guard-pipeline)
  - [3. Concurrency-Safe Seat Reservation & Replays](#3-concurrency-safe-seat-reservation--replays)
  - [4. Direct-to-Cloud Media Ingestion (Cloudinary)](#4-direct-to-cloud-media-ingestion-cloudinary)
  - [5. Automated Cron Expiry & Waitlist Promotion](#5-automated-cron-expiry--waitlist-promotion)
  - [6. High-Throughput Redis Caching & k6 Load Resilience](#6-high-throughput-redis-caching--k6-load-resilience)
- [Quick Start Guide](#quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [Option A: Local Development Setup](#option-a-local-development-setup)
  - [Option B: 1-Click Docker Compose](#option-b-1-click-docker-compose)
- [Environment Configuration](#environment-configuration)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [API Reference](#api-reference)
- [Roadmap & Upcoming Milestones](#roadmap--upcoming-milestones)
- [Contributing & License](#contributing--license)
- [Author & Acknowledgments](#author--acknowledgments)

---

## 🌟 Overview

Finding a quiet, dependable study space with high-speed internet, ergonomic seating, and air conditioning is one of the highest friction hurdles for students preparing for competitive exams (UPSC, NEET, JEE, GATE, CAT). Simultaneously, independent library owners struggle with manual pen-and-paper registers, chaotic cash collections, under-utilized seats, and lack of marketing reach.

**Scholar's Hub** solves this through a state-of-the-art, high-performance monorepo platform that unifies students, library hosts, and platform administrators into an automated, transparent ecosystem.

### What Makes Scholar's Hub Stand Out?
- ⚡ **Next.js 16 + React 19** frontend leveraging Server Components, Turbopack, and progressive hydration.
- 🛡️ **Zero-CORS Architecture** passing `httpOnly` authenticated sessions seamlessly without exposing secrets or browser storage.
- 📍 **Geospatial Discovery** with Google Maps, distance radiuses, and dynamic clustering.
- 💬 **Bidirectional Real-Time Communication** via Socket.io with typing indicators and read receipts.
- 🎫 **Digital QR Identity Cards** & contact-free attendance logs.
- 📊 **Executive Analytics & PDF Reporting** for platform revenue, commissions, and library occupancy.
- 🚀 **Sub-500ms p95 Latency** under heavy load via Redis multi-tier caching.

---

## 🏗️ System Architecture

Scholar's Hub is structured as a tightly decoupled, high-cohesion monorepo:

```
                            ┌────────────────────────────────────────┐
                            │          Browser / Mobile PWA          │
                            │  (Dark/Light UI, GSAP, Tailwind v4)    │
                            └──────────────────┬─────────────────────┘
                                               │
                                     HTTP / WebSocket (:3000)
                                               │
                                               ▼
                            ┌────────────────────────────────────────┐
                            │           Next.js 16 App Router        │
                            │   - Edge & Node SSR Server Components  │
                            │   - Middleware Session Check           │
                            │   - Internal Next Rewrite (/api/*)     │
                            └──────────────────┬─────────────────────┘
                                               │
                                    Server-to-Server Proxy
                                       (Zero-CORS Cookie)
                                               │
                                               ▼
                            ┌────────────────────────────────────────┐
                            │       Express.js API Engine (:5000)    │
                            │   - JWT Verification & RBAC Guards     │
                            │   - Zod Validation & Controller Layer  │
                            │   - Socket.io Real-Time Event Mesh     │
                            │   - Node-Cron Auto-Expiry Worker       │
                            └────┬─────────┬─────────┬─────────┬─────┘
                                 │         │         │         │
                 ┌───────────────┘         │         │         └───────────────┐
                 ▼                         ▼         ▼                         ▼
      ┌────────────────────┐     ┌───────────┐ ┌───────────┐        ┌────────────────────┐
      │   MongoDB Atlas    │     │   Redis   │ │ Razorpay  │        │ Cloudinary Storage │
      │  Mongoose ODM v9   │     │  Cache v7 │ │ Gateway   │        │ Signed Uploads CDN │
      │ (Atomic Bookings)  │     │(Hot Reads)│ │(Payments) │        │ (Zero Server Load) │
      └────────────────────┘     └───────────┘ └───────────┘        └────────────────────┘
```

---

## ✨ Key Features

### 🎓 Student Experience
- **Interactive Geospatial Map Search**: Browse verified study spaces powered by the Google Maps JavaScript API with `@googlemaps/markerclusterer`, radius range queries, and live location detection.
- **Granular Filter Engine**: Filter by amenities (AC, 5G WiFi, Personal Lockers, Silent Zone, Power Sockets, RO Water, CCTV), pricing tiers, operating hours, and exam disciplines.
- **Side-by-Side Comparison Matrix**: Compare up to 4 libraries simultaneously across pricing, slot timings, amenities, ratings, and deposit policies.
- **Seat & Slot Reservation**: Select dedicated time slots (Morning, Evening, Full Day, Night Owl) with live seat counter updates.
- **Frictionless Checkout**: Secure payments powered by **Razorpay** with automatic fallback to development mock orders and instant dynamic coupon discount calculation.
- **Automated Waitlist Engine**: Automatically queue for sold-out libraries; instant real-time in-app and email notifications trigger when a slot opens up due to cancellation or expiry.
- **Digital Student Identity Card**: Dynamic QR-encoded identity badge generated directly in the browser; allows one-click check-ins and downloadable PDF passes.
- **Automated PDF Invoices**: Instant receipt generation with itemized fee breakdown (library charges, platform commission, coupon deduction) using `@react-pdf/renderer`.
- **Live Host Chat**: Seamless real-time messaging with library owners via Socket.io with typing indicators, delivery timestamps, and unread badges.
- **Dispute Resolution Portal**: File and track dispute claims with evidence uploads, status timelines, and administrative mediation.
- **Referral & Reward Hub**: Unique referral code generation, track active invitees, and earn platform discounts.
- **Wishlist & Community Reviews**: Save favorite spots and submit rich, verified reviews with star ratings and feedback.
- **EdTech Course Marketplace**: Enroll in competitive exam upskilling courses and track learning milestones.

### 🏢 Library Owner Portal
- **Complete Library Lifecycle Management**: Register and configure study hubs, geo-coordinates, facilities, pricing plans (monthly, quarterly, annual), and admission rules.
- **Zero-Bandwidth Cloudinary Gallery**: Direct browser-to-cloud photo uploads signed with server-minted short-lived cryptographic signatures.
- **Flexible Slot & Seat Architecture**: Define independent time slots, seat capacities, custom pricing overrides, and blocked maintenance dates.
- **Live Attendance & Roster**: Real-time roster of enrolled students, digital ID verification, and check-in/check-out timestamp logging.
- **Comprehensive Financial Ledger**: Detailed payout breakdowns distinguishing gross revenue, platform commission (2%), and net owner earnings.
- **Exportable Revenue Statements**: Download financial reports in CSV and styled PDF format via `@react-pdf/renderer`.
- **Real-Time Student Inquiries**: Answer prospective student inquiries directly from an integrated chat inbox.
- **Review Moderation**: Monitor verified student ratings, track community sentiment, and respond to feedback.

### 🛡️ Super Admin Command Center
- **Executive Platform Analytics**: High-level platform KPIs including Gross Merchandise Value (GMV), active bookings, user growth curves, and city-by-city distribution rendered with **Recharts**.
- **Library KYC & Verification Pipeline**: Audit submitted library applications, verify ownership credentials, approve listings, or ban non-compliant hubs.
- **Automated Dispute Arbitration**: Review escalated student complaints, examine booking audit trails, issue automated refunds, and close tickets.
- **Global Promotional Engine**: Create custom coupon codes, set percentage or fixed discounts, configure expiration timestamps, and enforce per-user usage limits.
- **Platform-Wide Notification Dispatcher**: Broadcast urgent announcements, scheduled maintenance notices, or promotional alerts across the entire user base or targeted roles.
- **Course & Curriculum Management**: Create, publish, and oversee courses, instructors, and enrolled student rosters.
- **Global User Directory**: Monitor user accounts, assign role permissions, and maintain platform security.

---

## 💻 Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend Framework** | **Next.js 16.2 (App Router)**, **React 19.2** | Server Components, Turbopack, dynamic routing, high-performance SSR |
| **Styling & UI** | **Tailwind CSS v4**, **Radix UI**, **Lucide Icons** | Ultra-modern design system, accessible primitives, sleek dark/light theme |
| **Animation & Motion** | **Motion (Framer Motion 12)**, **GSAP 3.15**, **Lenis** | Smooth scrolling, physics-based micro-interactions, canvas confetti celebrations |
| **Real-Time & Sockets** | **Socket.io 4.8** (Client & Server) | Real-time direct chat, typing indicators, read receipts, live alerts |
| **Mapping & Geospatial** | **Google Maps JS API**, **MarkerClusterer** | Interactive map exploration, geospatial radius clustering, custom map pins |
| **PDF & Digital ID** | **@react-pdf/renderer**, **qrcode.react**, **html2canvas** | Serverless client-side PDF invoices, dynamic QR passes, ID exports |
| **Backend API Engine**| **Node.js 22**, **Express 4.21**, **TypeScript 5.6** | Robust RESTful API, strict typing, scalable route separation |
| **Database & ODM** | **MongoDB 7.0**, **Mongoose 9.7** | Document storage, atomic transactions, aggregation pipelines, indexed geo-queries |
| **Caching Layer** | **Redis 7.0-alpine**, **ioredis 6.0** | Sub-millisecond response caching for public library listings and locations |
| **Payments** | **Razorpay SDK 2.9** | Secure payment orders, signature verification, webhook processing, test mocking |
| **Cloud Storage** | **Cloudinary v2** | Cryptographically signed, direct-to-cloud image asset storage |
| **Task Scheduling** | **node-cron 4.6** | Daily midnight cleanup, automated booking expiry, waitlist promotion engine |
| **Mailing Service** | **Nodemailer 7.0** | Transactional booking confirmations, waitlist release alerts |
| **Testing & Tooling** | **Vitest 4.1**, **mongodb-memory-server**, **k6** | Isolated in-memory integration testing, p95 performance load validation |
| **DevOps & Containers** | **Docker**, **Docker Compose** | Production-ready multi-container orchestration with healthchecks |

---

## 📁 Monorepo Directory Layout

```
ScholarHub/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated GitHub Actions CI (Typecheck + Vitest)
├── docker-compose.yml           # Multi-service stack (Mongo, Redis, API, Web)
├── k6-load-test.js              # High-concurrency performance benchmark script
│
├── server/                      # ── EXPRESS API BACKEND (Port 5000) ──
│   ├── src/
│   │   ├── app.ts               # Express configuration, CORS, routes & middleware
│   │   ├── index.ts             # HTTP server bootstrap & Socket.io handler
│   │   ├── lib/
│   │   │   ├── auth.ts          # JWT generation & session cookie decoder
│   │   │   ├── cloudinary.ts    # Secure signed upload token generator
│   │   │   ├── cron.ts          # Automated nightly booking expiry & waitlist dispatcher
│   │   │   ├── mongodb.ts       # Mongoose connection pooling & caching
│   │   │   ├── redis.ts         # Redis connection client with graceful fallback
│   │   │   └── socket.ts        # Socket.io instance registry
│   │   ├── middleware/
│   │   │   └── auth.ts          # Authentication, requireOwner & requireAdmin guards
│   │   ├── models/              # Mongoose schemas (User, Library, Booking, Slot, etc.)
│   │   ├── routes/              # Modular API controllers (auth, bookings, owner, etc.)
│   │   └── test/                # Vitest test suite with in-memory MongoDB
│   ├── package.json
│   └── tsconfig.json
│
└── web/                         # ── NEXT.JS 16 FRONTEND (Port 3000) ──
    ├── public/                  # Static assets, PWA manifest, service worker
    ├── src/
    │   ├── app/
    │   │   ├── (dashboard)/     # Authenticated layouts & role-based dashboards
    │   │   │   ├── admin/       # Super Admin (Analytics, Disputes, Coupons, etc.)
    │   │   │   ├── owner/       # Library Owner (Slots, Attendance, Revenue, etc.)
    │   │   │   └── student/     # Student (Bookings, Digital ID, Wishlist, Chat)
    │   │   ├── (public)/        # Public marketing pages (About, Contact, Courses)
    │   │   ├── auth/            # Sign in, Sign up, Role selector flows
    │   │   ├── libraries/       # Search directory, interactive filter sidebar
    │   │   ├── library/[id]/    # Rich library details, photo gallery, slot selector
    │   │   ├── map/             # Fullscreen Google Maps exploration view
    │   │   ├── layout.tsx       # Root layout with ThemeProvider & SocketProvider
    │   │   └── page.tsx         # High-converting landing page with GSAP animations
    │   ├── components/          # Reusable UI component library (Shadcn + Radix)
    │   ├── hooks/               # Custom hooks (useChat, useSocket, useWishlist)
    │   ├── lib/                 # Auth sessions, API clients, PDF document schemas
    │   └── middleware.ts        # Fast-path edge session cookie validation
    ├── package.json
    └── next.config.ts           # Server-side /api/* proxy rewrite configuration
```

---

## 🔒 Engineering Highlights & Security

### 1. Zero-CORS Cookie Rewrite Architecture

The frontend never calls the Express server directly from client-side JavaScript. Instead, Next.js handles server-side proxy rewrites in `next.config.ts`:

```typescript
// web/next.config.ts
async rewrites() {
  const serverOrigin = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return [
    {
      source: "/api/:path*",
      destination: `${serverOrigin}/api/:path*`,
    },
  ];
}
```

```
Client Browser  ──────>  localhost:3000/api/auth/login
                              │ (Next.js server-side rewrite)
                              ▼
Express Backend ──────>  localhost:5000/api/auth/login
```

**Why this is superior:**
- **No CORS Pitfalls**: Requests are same-origin (`localhost:3000`), completely eliminating preflight `OPTIONS` overhead and CORS handshake vulnerabilities.
- **True `httpOnly` Security**: Auth cookies (`scholars_session`) are unreachable by malicious client scripts (100% immune to XSS token theft).
- **Seamless SSR**: Next.js Server Components and client components use identical API paths without configuration drift.

---

### 2. Triple-Tier Security & RBAC Guard Pipeline

Every incoming request passes through three independent defensive perimeters:

```
Request ──> [ Tier 1: Next.js Edge Middleware ]  (Cookie presence check & instant redirect)
                 │
                 ├──> [ Tier 2: Next.js Server Components ] (Cryptographic verify before layout render)
                           │
                           └──> [ Tier 3: Express API Guards ] (Full JWT validation, DB lookups & RBAC)
```

1. **Tier 1 — Next.js Edge Middleware (`web/src/middleware.ts`)**: Fast-path boundary. Inspects the request for `scholars_session` and intercepts unauthenticated access before expensive page components are ever invoked.
2. **Tier 2 — Server Component Boundary (`web/src/lib/auth-session.ts`)**: Invokes `jwt.verify` inside Next.js Server Components using `JWT_SECRET` to ensure sensitive dashboard layouts (Student, Owner, Admin) cannot be viewed via client manipulation.
3. **Tier 3 — Express API Middlewares (`server/src/middleware/auth.ts`)**: The final authority. Cryptographically validates signatures and enforces granular RBAC:
   - `requireAuth`: Confirms active identity.
   - `requireOwner`: Restricts endpoints to verified library owners.
   - `requireAdmin`: Guards platform configurations. Requires `ADMIN_SECRET_KEY` during administrator provisioning.

---

### 3. Concurrency-Safe Seat Reservation & Replays

Study space capacity is limited and prone to race conditions during peak exam registration periods. Scholar's Hub guarantees data integrity:

- **Atomic Decrements**: Seat allocations use atomic MongoDB `$inc` operations with strict preconditions (`availableSeats: { $gt: 0 }`).
- **Cryptographic Signature Verification**: Razorpay payment webhooks and capture callbacks verify HMAC-SHA256 signatures (`razorpay_order_id|razorpay_payment_id`) against `RAZORPAY_KEY_SECRET`.
- **Replay Protection**: Orders cannot be claimed twice; idempotency checks ensure duplicate requests return the existing confirmed booking without double-booking seats.

---

### 4. Direct-to-Cloud Media Ingestion (Cloudinary)

Uploading high-resolution library photos through an application server wastes server memory and network bandwidth. 

Scholar's Hub utilizes a **pre-signed direct upload protocol**:
1. The authenticated library owner requests an upload authorization via `GET /api/owner/library/photos/signature`.
2. The Express server validates the owner's session and generates a short-lived HMAC signature pinned specifically to `folder: "scholarshub/libraries/<libraryId>"`.
3. The browser uploads the image directly to Cloudinary via multipart form data.
4. The server accepts and saves the resulting image URL *only if* it originates from our verified Cloudinary tenant domain.

---

### 5. Automated Cron Expiry & Waitlist Promotion

Scholar's Hub runs an autonomous background maintenance worker (`server/src/lib/cron.ts`) scheduled at `02:00` daily:

```
[ Nightly 02:00 Worker ]
       │
       ├──> Identify bookings where endDate < now AND status == "ACTIVE"
       │         │
       │         └──> Mark status: "EXPIRED"
       │         └──> Atomically increment slot & library availableSeats (+1)
       │
       └──> Query Waitlist collection for the freed slot
                 │
                 └──> Dispatch in-app Notification to the #1 queued student
                 └──> Send urgent email alert via Nodemailer
                 └──> Hold reservation window for 24 hours
```

---

### 6. High-Throughput Redis Caching & k6 Load Resilience

Public read endpoints (such as `GET /api/libraries` and `GET /api/locations`) receive massive traffic spikes. 

- **Cache Strategy**: Queries are keyed by serialized query parameters and cached in **Redis** with a sliding TTL. Cache invalidation hooks automatically purge stale entries when an owner updates their library profile or slot capacity.
- **Performance Benchmarks**: Verified via an automated **k6 load test** (`k6-load-test.js`):
  - **Sustained Load**: 100 concurrent Virtual Users (VUs).
  - **p95 Latency**: `< 500ms` across all catalog queries.
  - **Error Rate**: `< 0.01%` under peak traffic spikes.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.x or v22.x recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or free MongoDB Atlas cluster)
- [Redis](https://redis.io/) (Optional for dev, recommended for caching)
- [Git](https://git-scm.com/)

---

### Option A: Local Development Setup

#### 1. Clone the repository
```bash
git clone https://github.com/Deepak-Anuragi/ScholarHub.git
cd ScholarHub
```

#### 2. Terminal 1 — Backend API Server
```bash
cd server
cp .env.example .env
# Fill in MONGODB_URI and JWT_SECRET in server/.env

npm install
npm run dev
# Server boots on http://localhost:5000 with tsx hot-reloading
```

> **Generating a secure JWT Secret:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

#### 3. Terminal 2 — Frontend Application
```bash
cd web
cp .env.example .env.local
# Set JWT_SECRET in web/.env.local (MUST match server/.env)

npm install
npm run dev
# Frontend boots on http://localhost:3000
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

### Option B: 1-Click Docker Compose

Launch the complete production-identical stack (MongoDB 7, Redis 7, API Server, and Web Client) with a single command:

```bash
# 1. Provide your environment variables
export JWT_SECRET="your-secure-random-secret"

# 2. Spin up all containers
docker compose up --build
```

| Service | Port | Healthcheck |
|---|---|---|
| **Web Frontend** | `http://localhost:3000` | Automated Next.js readiness |
| **API Server** | `http://localhost:5000` | `GET /health` (`wget`) |
| **MongoDB** | `localhost:27017` | `mongosh db.adminCommand('ping')` |
| **Redis** | `localhost:6379` | `redis-cli ping` |

To stop the containers:
```bash
docker compose down -v
```

---

## ⚙️ Environment Configuration

### `server/.env`

| Variable | Type | Default | Description |
|---|:---:|:---:|---|
| `PORT` | Number | `5000` | Express server port |
| `NODE_ENV` | String | `development` | Runtime environment (`development` \| `production`) |
| `MONGODB_URI` | String | *Required* | MongoDB connection URI (Atlas or local) |
| `CLIENT_URL` | String | `http://localhost:3000` | Allowed CORS origins (comma-separated for multiple) |
| `JWT_SECRET` | String | *Required* | Secret key used to sign session cookies |
| `JWT_EXPIRES_IN` | String | `30d` | JWT token lifespan |
| `ADMIN_SECRET_KEY` | String | *Required for admin* | Passcode required for `/api/auth/signup/admin` |
| `PLATFORM_RATE` | Number | `0.02` | Platform commission rate charged to students (2%) |
| `REDIS_URL` | String | `redis://localhost:6379`| Connection URI for Redis cache |
| `RAZORPAY_KEY_ID` | String | Optional (dev) | Razorpay public key (falls back to mock orders if blank) |
| `RAZORPAY_KEY_SECRET` | String | Optional (dev) | Razorpay secret key |
| `CLOUDINARY_CLOUD_NAME`| String | Optional | Cloudinary account cloud name for photo uploads |
| `CLOUDINARY_API_KEY` | String | Optional | Cloudinary API access key |
| `CLOUDINARY_API_SECRET`| String | Optional | Cloudinary API secret |
| `SMTP_HOST` / `USER` | String | Optional | SMTP credentials for Nodemailer notification emails |
| `CRON_TIMEZONE` | String | `Asia/Kolkata` | Timezone for scheduled midnight expiry jobs |
| `DISABLE_CRON` | Boolean | `false` | Set `true` to disable background worker |

### `web/.env.local`

| Variable | Type | Default | Description |
|---|:---:|:---:|---|
| `JWT_SECRET` | String | *Required* | **Must match `server/.env`** for Server Component verification |
| `NEXT_PUBLIC_API_URL` | String | `http://localhost:5000`| Express server URL used during SSR fetches |
| `NEXT_PUBLIC_APP_URL` | String | `http://localhost:3000`| Base application domain |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | String | Optional | Google Maps API key restricted by HTTP referrer |

---

## 🧪 Testing & Quality Assurance

Scholar's Hub incorporates a multi-tiered automated testing framework to guarantee zero regressions.

```bash
# 1. Run Vitest Unit & Integration Tests (Server)
cd server
npm test

# 2. Strict TypeScript Verification
cd server && npm run typecheck
cd web && npm run lint

# 3. Execute k6 Load Test (Requires k6 installed)
k6 run k6-load-test.js
```

### What the Vitest Test Suite Covers:
- 🛡️ **Cookie Integrity**: Rejection of unsigned, tampered, or forged JWT session tokens.
- 🚦 **Role Authorization**: Verification that students cannot access owner/admin endpoints and vice versa.
- ⚡ **Booking Race Scenarios**: Prevention of replay attacks; ensuring single-seat decrement under concurrent requests.
- 💰 **Financial Split Auditing**: Mathematical certainty that `libraryFee + platformShare == amountPaid`.
- 🖼️ **Security Whitelisting**: Guaranteed rejection of non-Cloudinary image URLs and unauthorized schema mutations.
- 💾 **Zero External Dependencies**: Powered by `mongodb-memory-server`, tests run completely offline with ephemeral in-memory databases.

---

## 📡 API Reference

A sample of core RESTful endpoints provided by the backend:

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/signup/student` | Public | Register new student profile |
| `POST` | `/api/auth/signup/owner` | Public | Register new library owner profile |
| `POST` | `/api/auth/signup/admin` | Secret | Register platform admin (requires `ADMIN_SECRET_KEY`) |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue signed `httpOnly` cookie |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate and clear session cookie |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current session profile and permissions |

### Libraries & Catalog (`/api/libraries`)
| Method | Endpoint | Access | Description |
|---|---|:---:|---|
| `GET` | `/api/libraries` | Public | Paginated list of libraries with Redis caching & geo-filters |
| `GET` | `/api/libraries/:id` | Public | Detailed library specifications, slots, and photo gallery |
| `GET` | `/api/locations` | Public | Distinct list of cities and districts for search autofill |

### Bookings & Checkout (`/api/bookings`)
| Method | Endpoint | Access | Description |
|---|---|:---:|---|
| `POST` | `/api/bookings/create-order` | Student | Initialize Razorpay order & lock slot pricing |
| `POST` | `/api/bookings/verify` | Student | Verify payment signature, confirm seat, and issue booking |

### Student Operations (`/api/student`)
| Method | Endpoint | Access | Description |
|---|---|:---:|---|
| `GET` | `/api/student/stats` | Student | Dashboard metrics (active bookings, total spend, reviews) |
| `GET` | `/api/student/bookings` | Student | Historical & current booking list with receipt data |
| `DELETE`| `/api/student/bookings/:id`| Student | Cancel booking, compute prorated refund & restore seat |
| `GET` | `/api/student/digital-id` | Student | Generate dynamic student QR identity card |
| `POST` | `/api/student/wishlist` | Student | Add library to personal wishlist |
| `POST` | `/api/student/waitlist` | Student | Join waitlist for full library slot |
| `POST` | `/api/student/disputes` | Student | File a dispute against a booking |

### Owner Operations (`/api/owner`)
| Method | Endpoint | Access | Description |
|---|---|:---:|---|
| `GET` | `/api/owner/library` | Owner | Retrieve owned library details |
| `PUT` | `/api/owner/library` | Owner | Update library profile, amenities, and timings |
| `GET` | `/api/owner/library/photos/signature` | Owner | Mint short-lived Cloudinary direct upload signature |
| `POST` | `/api/owner/slots` | Owner | Create new seat slot with custom pricing |
| `GET` | `/api/owner/students` | Owner | View roster of enrolled students & check-in timestamps |
| `GET` | `/api/owner/revenue` | Owner | Payout ledger, platform fees, and gross analytics |

### Real-Time Chat (`/api/chat`)
| Method | Endpoint | Access | Description |
|---|---|:---:|---|
| `GET` | `/api/chat/conversations` | Authenticated | List all active direct chat threads |
| `GET` | `/api/chat/messages/:userId` | Authenticated | Retrieve conversation history with a specific user |

---

## 📈 Roadmap & Upcoming Milestones

- [x] **Next.js 16 App Router & React 19 Migration**
- [x] **Full-Featured Dark / Light Theme System**
- [x] **Redis Caching Layer for Public Endpoints**
- [x] **Docker Compose Multi-Container Orchestration**
- [x] **Automated k6 Load Testing Suite**
- [x] **Dispute Resolution & Dynamic Coupon Discount System**
- [x] **Downloadable PDF Receipts via `@react-pdf/renderer`**
- [ ] Native Mobile App wrapper via Capacitor / React Native
- [ ] AI-Powered Study Slot Recommendation Engine based on past exam habits
- [ ] IoT Smart Door Lock Integration for automatic QR access at library turnstiles

---

## 🤝 Contributing & License

Contributions, feedback, and feature suggestions are warmly welcomed!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author & Acknowledgments

**Deepak Anuragi**  
Full-Stack Software Engineer & Open Source Contributor  
- **GitHub**: [@Deepak-Anuragi](https://github.com/Deepak-Anuragi)
- **Repository**: [ScholarHub Monorepo](https://github.com/Deepak-Anuragi/ScholarHub)

<div align="center">
  <sub>Built with ❤️ for students, competitive exam aspirants, and study space hosts everywhere.</sub>
</div>
