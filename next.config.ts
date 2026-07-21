import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-side geometry/LLM work only; no image optimization needed on Workers.
  images: { unoptimized: true },
};

export default nextConfig;

// Enable local dev integration with the Cloudflare runtime when running `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
