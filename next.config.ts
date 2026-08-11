import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Never ship Inngest Dev Server mode to Vercel production.
  // Auto-apply only creates Browserbase sessions when Inngest runs in cloud mode.
  env: {
    INNGEST_DEV:
      process.env.VERCEL_ENV === "production" || process.env.VERCEL === "1"
        ? "0"
        : process.env.INNGEST_DEV,
  },
};

export default nextConfig;
