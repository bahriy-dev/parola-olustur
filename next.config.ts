import type { NextConfig } from "next";
import { HASH_TOOL_SLUGS } from "./src/lib/hash-tool-routes";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    // The legacy XSS auditor is removed from modern browsers and could be abused where it remains; CSP is the real defence.
    key: "X-XSS-Protection",
    value: "0",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: false,
  compress: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return Object.entries(HASH_TOOL_SLUGS).flatMap(([id, slug]) => [
      { source: `/araclar/${id}`, destination: `/hash/${slug}`, permanent: true },
      { source: `/en/tools/${id}`, destination: `/en/hash/${slug}`, permanent: true },
    ]);
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
