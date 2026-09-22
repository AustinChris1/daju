import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg must stay a Node module at runtime; bundling it breaks its optional Cloudflare import.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
