import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Only upload source maps in production
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps for better debugging
  widenClientFileUpload: true,

  // Hide source maps from users
  hideSourceMaps: true,

  // Disable logger to reduce bundle size
  disableLogger: true,

  // Automatically tree-shake Sentry logger statements
  automaticVercelMonitors: true,
};

// Wrap with Sentry only if DSN is configured
const config = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;

export default config;
