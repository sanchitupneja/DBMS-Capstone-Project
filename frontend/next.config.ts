import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.API_URL ? `${process.env.API_URL}/api` : ''),
  },
  outputFileTracingRoot: path.join(__dirname, "../"),
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Disable agent upgrade reminders during dev/build. With AGENT=1 set in
    // this environment, Next.js otherwise throws a fatal SecurityFatalError
    // on the first request and exits the dev server with code 1.
    agentUpgrade: false,
    // These pages are client-rendered and have no static shell to validate,
    // so only validate routes that explicitly opt in with `export const instant`.
    instantInsights: {
      validationLevel: 'manual-warning',
    },
  },
};

export default nextConfig;
