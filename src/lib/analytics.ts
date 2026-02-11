// ─────────────────────────────────────────────────────────────
// Analytics stubs (PostHog removed)
// Exports are kept as no-ops so existing call sites don't break.
// ─────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-unused-vars */

export function initAnalytics() {}

export function identifyUser(_userId: string, _properties?: Record<string, unknown>) {}

export function resetUser() {}

export function track(_event: string, ..._args: unknown[]) {}

export const funnels = {
  artistSignup: {
    start: () => {},
    selectRole: (_role: string) => {},
    submit: (_role: string) => {},
    complete: (_userId: string, _role: string) => {},
  },
  artistOnboarding: {
    start: () => {},
    enterName: () => {},
    selectGenres: (_genres: string[]) => {},
    complete: () => {},
  },
  trackSubmission: {
    start: () => {},
    enterUrl: (_sourceType: string) => {},
    validateUrl: (_sourceType: string, _success: boolean) => {},
    selectGenres: (_genres: string[]) => {},
    selectPackage: (_pkg: string, _price: number, _reviewCount: number) => {},
    complete: () => {},
  },
  checkout: {
    start: (_pkg: string, _price: number, _trackId: string) => {},
    complete: (_pkg: string, _price: number, _trackId: string) => {},
    abandon: (_pkg: string, _price: number) => {},
  },
  reviewerOnboarding: {
    start: () => {},
    selectGenres: (_genres: string[]) => {},
    complete: () => {},
  },
  review: {
    start: (_trackId: string, _reviewId: string) => {},
    play: (_trackId: string) => {},
    pause: (_trackId: string, _listenTime: number) => {},
    minimumReached: (_trackId: string, _listenTime: number) => {},
    submit: (_trackId: string, _reviewId: string, _listenTime: number) => {},
    complete: (_trackId: string, _reviewId: string, _earnings: number) => {},
  },
};

export function trackPageView(_path: string, _referrer?: string) {}
export function trackError(_message: string, _page: string) {}
export function trackApiError(_endpoint: string, _status: number, _message: string) {}
export function isFeatureEnabled(_flag: string): boolean { return false; }
export function getFeatureFlag(_flag: string): string | boolean | undefined { return undefined; }
