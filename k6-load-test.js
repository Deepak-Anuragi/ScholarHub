/**
 * k6 load test for Scholar's Hub API server.
 *
 * Targets the two public endpoints that don't require auth:
 *   - GET /health           (baseline latency, no DB)
 *   - GET /api/libraries    (full DB query with Redis caching)
 *   - GET /api/locations    (lightweight DB query)
 *
 * Run:  k6 run k6-load-test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";

export const options = {
  stages: [
    { duration: "10s", target: 50 },   // ramp up to 50 VUs
    { duration: "30s", target: 50 },   // sustain 50 VUs
    { duration: "10s", target: 100 },  // spike to 100 VUs
    { duration: "20s", target: 100 },  // sustain 100 VUs
    { duration: "10s", target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],  // 95% of requests under 500ms
    http_req_failed: ["rate<0.01"],    // less than 1% failure rate
  },
};

export default function () {
  // 1. Health check — tests raw Express latency
  const health = http.get(`${BASE_URL}/health`);
  check(health, {
    "health status 200": (r) => r.status === 200,
    "health body ok": (r) => JSON.parse(r.body).status === "ok",
  });

  // 2. Library listing — the most-hit endpoint, cached by Redis
  const libraries = http.get(`${BASE_URL}/api/libraries?page=1&limit=12`);
  check(libraries, {
    "libraries status 200": (r) => r.status === 200,
  });

  // 3. Locations — lightweight lookup
  const locations = http.get(`${BASE_URL}/api/locations`);
  check(locations, {
    "locations status 200 or 503": (r) => r.status === 200 || r.status === 503,
  });

  sleep(0.3);
}
