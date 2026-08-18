import { execSync } from "node:child_process";

// The app "version" is the number of commits — a monotonically rising build
// number, baked into the client bundle. The build is done locally then
// committed (cPanel/Passenger can't build), so this is computed here.
let commitCount = "0";
try {
  commitCount = execSync("git rev-list --count HEAD").toString().trim() || "0";
} catch {
  // no git — keep the fallback
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_APP_VERSION: commitCount },
  // Type-check + lint run locally before every push; skip them on the server
  // build to keep the cPanel/Passenger build light.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Baseline security headers on every response. These are safe, browser-standard
  // hardening (no CSP yet — a nonce-based CSP is a separate, browser-verified
  // step so it can't silently break rendering). HSTS only takes effect over
  // HTTPS, which production (crm.sajtpress.rs) already is.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ];
  },
};

export default nextConfig;
