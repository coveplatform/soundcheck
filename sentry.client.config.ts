import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust sample rate in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay for debugging user issues
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Capture console logs as breadcrumbs
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: true,
      blockAllMedia: false,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Filter out noisy errors
  ignoreErrors: [
    // Random browser plugins/extensions
    "top.GLOBALS",
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    "http://tt.telekomite.net",
    "atomicFindClose",
    // Facebook borked
    "fb_xd_fragment",
    // Chrome extensions
    "chrome-extension://",
    // Ignore network errors
    "Failed to fetch",
    "NetworkError",
    "Load failed",
    // Ignore cancelled requests
    "AbortError",
    // Ignore hydration warnings (common in dev)
    "Hydration failed",
    "Text content did not match",
  ],

  // Environment
  environment: process.env.NODE_ENV,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  // Debug mode in development
  debug: false,
});
