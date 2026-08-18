import type { NextConfig } from "next";

const API_SERVER =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  // Allow HMR (hot-reload) connections from any local network IP.
  // This is needed when accessing the dev server from another device
  // on the same network (e.g. phone, tablet, or LAN IP in browser).
  allowedDevOrigins: ["10.0.0.0/8", "192.168.0.0/16", "172.16.0.0/12"],

  // Proxy all /api/* requests to the Express backend.
  // This keeps the browser on the same origin (e.g. yourdomain.com)
  // so httpOnly cookies are sent correctly on every request.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_SERVER}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
