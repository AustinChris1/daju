import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg must stay a Node module at runtime; bundling it breaks its optional Cloudflare import.
  serverExternalPackages: ["pg"],
  // The docs pages read markdown from the repo at request time.
  outputFileTracingIncludes: { "/docs/[slug]": ["./docs/*.md"], "/docs": ["./docs/*.md"] },
};

export default nextConfig;
