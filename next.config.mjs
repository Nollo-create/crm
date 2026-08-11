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
};

export default nextConfig;
