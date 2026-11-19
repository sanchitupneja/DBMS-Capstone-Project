import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
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
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
