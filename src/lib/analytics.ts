import posthog from "posthog-js";

// ─────────────────────────────────────────────────────────────
// POSTHOG INITIALIZATION
// ─────────────────────────────────────────────────────────────

let isInitialized = false;

export function initAnalytics() {
  if (typeof window === "undefined") return;
  if (isInitialized) return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: {
        password: true,
      },
    },
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") {
        // Uncomment to debug in dev:
        // posthog.debug();
      }
    },
  });

  isInitialized = true;
}

// ─────────────────────────────────────────────────────────────
// USER IDENTIFICATION
// ─────────────────────────────────────────────────────────────

export function identifyUser(
  userId: string,
  properties?: {
    email?: string;
    name?: string;
    isArtist?: boolean;
    isReviewer?: boolean;
    artistProfileId?: string;
    reviewerProfileId?: string;
  }
) {
  if (typeof window === "undefined") return;
  posthog.identify(userId, properties);
}

export function resetUser() {
  if (typeof window === "undefined") return;
  posthog.reset();
}

// ─────────────────────────────────────────────────────────────
// ANALYTICS EVENT TYPES
// ─────────────────────────────────────────────────────────────

type SignupEvents = {
  signup_page_viewed: undefined;
  signup_role_selected: { role: "artist" | "reviewer" | "both" };
  signup_form_submitted: { role: "artist" | "reviewer" | "both" };
  signup_completed: { userId: string; role: "artist" | "reviewer" | "both" };
  signup_failed: { error: string };
};

type AuthEvents = {
  login_page_viewed: undefined;
  login_attempted: undefined;
  login_completed: { userId: string };
  login_failed: { error: string };
  logout_clicked: undefined;
  password_reset_requested: undefined;
  password_reset_completed: undefined;
  email_verification_sent: undefined;
  email_verification_completed: undefined;
  email_verification_resent: undefined;
};

type ArtistOnboardingEvents = {
  artist_onboarding_started: undefined;
  artist_onboarding_name_entered: undefined;
  artist_onboarding_genres_selected: { genres: string[]; count: number };
  artist_onboarding_completed: undefined;
};

type TrackSubmissionEvents = {
  track_submission_started: undefined;
  track_url_entered: { sourceType: string };
  track_url_validated: { sourceType: string; success: boolean };
  track_genres_selected: { genres: string[]; count: number };
  track_package_selected: { package: string; price: number; reviewCount: number };
  track_feedback_focus_entered: { hasContent: boolean };
  track_submission_form_completed: undefined;
  checkout_started: { package: string; price: number; trackId: string };
  checkout_completed: { package: string; price: number; trackId: string };
  checkout_abandoned: { package: string; price: number };
  track_cancelled: { trackId: string; hadPayment: boolean };
};

type ArtistDashboardEvents = {
  artist_dashboard_viewed: { trackCount: number; activeCount: number };
  artist_track_clicked: { trackId: string; status: string };
  artist_track_feedback_viewed: { trackId: string; reviewCount: number };
  artist_review_rated: { reviewId: string; rating: number };
  artist_review_flagged: { reviewId: string; reason: string };
};

type ReviewerOnboardingEvents = {
  reviewer_onboarding_started: undefined;
  reviewer_onboarding_genres_selected: { genres: string[]; count: number };
  reviewer_onboarding_completed: undefined;
};

type ReviewerQueueEvents = {
  reviewer_queue_viewed: { queueSize: number };
  reviewer_track_opened: { trackId: string; genre: string };
  reviewer_track_skipped: { trackId: string; reason?: string };
};

type ReviewEvents = {
  review_started: { trackId: string; reviewId: string };
  review_audio_played: { trackId: string };
  review_audio_paused: { trackId: string; listenTime: number };
  review_listen_minimum_reached: { trackId: string; listenTime: number };
  review_form_field_filled: { field: string };
  review_form_submitted: { trackId: string; reviewId: string; listenTime: number };
  review_form_validation_failed: { field: string; error: string };
  review_completed: { trackId: string; reviewId: string; earnings: number };
};

type ReviewerEarningsEvents = {
  reviewer_earnings_viewed: { pendingBalance: number; totalEarnings: number };
  reviewer_payout_requested: { amount: number };
  reviewer_payout_completed: { amount: number };
  reviewer_stripe_connect_started: undefined;
  reviewer_stripe_connect_completed: undefined;
};

type TierEvents = {
  reviewer_tier_upgraded: { fromTier: string; toTier: string };
  reviewer_tier_downgraded: { fromTier: string; toTier: string };
};

type ErrorEvents = {
  error_displayed: { message: string; page: string };
  api_error: { endpoint: string; status: number; message: string };
  payment_error: { type: string; message: string };
};

type NavigationEvents = {
  page_viewed: { path: string; referrer?: string };
  cta_clicked: { location: string; destination: string };
  nav_link_clicked: { from: string; to: string };
};

// Combined events map
type AnalyticsEvents = SignupEvents &
  AuthEvents &
  ArtistOnboardingEvents &
  TrackSubmissionEvents &
  ArtistDashboardEvents &
  ReviewerOnboardingEvents &
  ReviewerQueueEvents &
  ReviewEvents &
  ReviewerEarningsEvents &
  TierEvents &
  ErrorEvents &
  NavigationEvents;

// ─────────────────────────────────────────────────────────────
// MAIN TRACKING FUNCTION
// ─────────────────────────────────────────────────────────────

export function track<K extends keyof AnalyticsEvents>(
  event: K,
  ...args: AnalyticsEvents[K] extends undefined
    ? []
    : [properties: AnalyticsEvents[K]]
) {
  if (typeof window === "undefined") return;

  const properties = args[0];

  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${event}`, properties || "");
  }

  posthog.capture(event, properties as Record<string, unknown>);
}

// ─────────────────────────────────────────────────────────────
// FUNNEL HELPERS
// ─────────────────────────────────────────────────────────────

// Helper to track funnel steps
export const funnels = {
  // Artist signup funnel
  artistSignup: {
    start: () => track("signup_page_viewed"),
    selectRole: (role: "artist" | "reviewer" | "both") =>
      track("signup_role_selected", { role }),
    submit: (role: "artist" | "reviewer" | "both") =>
      track("signup_form_submitted", { role }),
    complete: (userId: string, role: "artist" | "reviewer" | "both") =>
      track("signup_completed", { userId, role }),
  },

  // Artist onboarding funnel
  artistOnboarding: {
    start: () => track("artist_onboarding_started"),
    enterName: () => track("artist_onboarding_name_entered"),
    selectGenres: (genres: string[]) =>
      track("artist_onboarding_genres_selected", { genres, count: genres.length }),
    complete: () => track("artist_onboarding_completed"),
  },

  // Track submission funnel
  trackSubmission: {
    start: () => track("track_submission_started"),
    enterUrl: (sourceType: string) => track("track_url_entered", { sourceType }),
    validateUrl: (sourceType: string, success: boolean) =>
      track("track_url_validated", { sourceType, success }),
    selectGenres: (genres: string[]) =>
      track("track_genres_selected", { genres, count: genres.length }),
    selectPackage: (pkg: string, price: number, reviewCount: number) =>
      track("track_package_selected", { package: pkg, price, reviewCount }),
    complete: () => track("track_submission_form_completed"),
  },

  // Checkout funnel
  checkout: {
    start: (pkg: string, price: number, trackId: string) =>
      track("checkout_started", { package: pkg, price, trackId }),
    complete: (pkg: string, price: number, trackId: string) =>
      track("checkout_completed", { package: pkg, price, trackId }),
    abandon: (pkg: string, price: number) =>
      track("checkout_abandoned", { package: pkg, price }),
  },

  // Reviewer onboarding funnel
  reviewerOnboarding: {
    start: () => track("reviewer_onboarding_started"),
    selectGenres: (genres: string[]) =>
      track("reviewer_onboarding_genres_selected", { genres, count: genres.length }),
    complete: () => track("reviewer_onboarding_completed"),
  },

  // Review funnel
  review: {
    start: (trackId: string, reviewId: string) =>
      track("review_started", { trackId, reviewId }),
    play: (trackId: string) => track("review_audio_played", { trackId }),
    pause: (trackId: string, listenTime: number) =>
      track("review_audio_paused", { trackId, listenTime }),
    minimumReached: (trackId: string, listenTime: number) =>
      track("review_listen_minimum_reached", { trackId, listenTime }),
    submit: (trackId: string, reviewId: string, listenTime: number) =>
      track("review_form_submitted", { trackId, reviewId, listenTime }),
    complete: (trackId: string, reviewId: string, earnings: number) =>
      track("review_completed", { trackId, reviewId, earnings }),
  },
};

// ─────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────

// Track page views (for manual tracking if needed)
export function trackPageView(path: string, referrer?: string) {
  track("page_viewed", { path, referrer });
}

// Track errors
export function trackError(message: string, page: string) {
  track("error_displayed", { message, page });
}

// Track API errors
export function trackApiError(endpoint: string, status: number, message: string) {
  track("api_error", { endpoint, status, message });
}

// Feature flags (PostHog feature flags)
export function isFeatureEnabled(flag: string): boolean {
  if (typeof window === "undefined") return false;
  return posthog.isFeatureEnabled(flag) ?? false;
}

// Get feature flag variant
export function getFeatureFlag(flag: string): string | boolean | undefined {
  if (typeof window === "undefined") return undefined;
  return posthog.getFeatureFlag(flag);
}

// Export posthog for direct access if needed
export { posthog };
