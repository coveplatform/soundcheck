/**
 * Test Data Factories
 * Creates mock data for testing with sensible defaults
 */

import type { ReviewerTier } from '@prisma/client'
import type {
  User,
  ArtistProfile,
  ReviewerProfile,
  Track,
  Review,
  Genre,
  Payment,
  ReviewQueue,
} from '@prisma/client'

let idCounter = 0
const generateId = () => `test-id-${++idCounter}`

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: generateId(),
    email: `user-${idCounter}@example.com`,
    password: '$2a$10$mockhashedpassword',
    name: 'Test User',
    image: null,
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isArtist: false,
    isReviewer: false,
    referralSource: null,
    trialReminderSentAt: null,
    lastActiveAt: null,
    referralCode: null,
    referredByCode: null,
    referralCouponId: null,
    totalReferrals: 0,
    referralRewardsEarned: 0,
    ...overrides,
  }
}

export function createMockArtistProfile(
  overrides: Partial<ArtistProfile> = {}
): ArtistProfile {
  return {
    id: generateId(),
    userId: generateId(),
    artistName: 'Test Artist',
    totalTracks: 0,
    totalSpent: 0,
    pendingBalance: 0,
    totalEarnings: 0,
    stripeAccountId: null,
    stripeConnectedAt: null,
    hasSeenWelcome: false,
    completedOnboarding: false,
    hasSeenCreditGuide: false,
    reviewCredits: 1,
    totalCreditsEarned: 0,
    totalCreditsSpent: 0,
    totalPeerReviews: 0,
    peerReviewRating: 0,
    peerGemCount: 0,
    peerFlagCount: 0,
    stripeCustomerId: null,
    subscriptionStatus: null,
    subscriptionId: null,
    subscriptionTier: null,
    reviewerExpertise: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockReviewerProfile(
  overrides: Partial<ReviewerProfile> = {}
): ReviewerProfile {
  return {
    id: generateId(),
    userId: generateId(),
    tier: 'NORMAL' as ReviewerTier,
    totalReviews: 0,
    averageRating: 0,
    totalEarnings: 0,
    pendingBalance: 0,
    stripeAccountId: null,
    stripeConnectedAt: null,
    country: null,
    onboardingQuizScore: 0,
    onboardingQuizPassed: true,
    onboardingQuizCompletedAt: new Date(),
    gemCount: 0,
    flagCount: 0,
    isRestricted: false,
    completedOnboarding: true,
    reviewsToday: 0,
    lastReviewDate: null,
    affiliateEarnings: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockGenre(overrides: Partial<Genre> = {}): Genre {
  const name = overrides.name || 'Electronic'
  return {
    id: generateId(),
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    ...overrides,
  }
}

export function createMockTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: generateId(),
    artistId: generateId(),
    sourceUrl: 'https://soundcloud.com/test/track',
    sourceType: 'SOUNDCLOUD',
    title: 'Test Track',
    artworkUrl: null,
    duration: 180,
    bpm: null,
    feedbackFocus: null,
    isPublic: false,
    allowPurchase: false,
    trackShareId: null,
    sharingEnabled: false,
    sharingMode: null,
    salePrice: null,
    showReviewsOnPublicPage: true,
    publicPlayCount: 0,
    status: 'QUEUED',
    packageType: 'STANDARD',
    reviewsRequested: 10,
    reviewsCompleted: 0,
    creditsSpent: 0,
    promoCode: null,
    createdAt: new Date(),
    paidAt: new Date(),
    completedAt: null,
    linkIssueNotifiedAt: null,
    viewCount: 0,
    feedbackViewedAt: null,
    lastViewedAt: null,
    requestedProReviewers: false,
    rushDelivery: false,
    rushDeliveryDeadline: null,
    cashAddOnTotal: 0,
    releaseDecisionReport: null,
    releaseDecisionGeneratedAt: null,
    ...overrides,
  }
}

export function createMockReview(overrides: Partial<Review> = {}): Review {
  return {
    id: generateId(),
    trackId: generateId(),
    reviewerId: generateId(),
    peerReviewerArtistId: null,
    isPeerReview: false,
    status: 'ASSIGNED',
    reviewSchemaVersion: 1,
    countsTowardCompletion: true,
    countsTowardAnalytics: true,
    listenDuration: 0,
    lastHeartbeat: null,
    firstImpression: null,
    productionScore: null,
    vocalScore: null,
    originalityScore: null,
    wouldListenAgain: null,
    wouldAddToPlaylist: null,
    wouldShare: null,
    wouldFollow: null,
    perceivedGenre: null,
    similarArtists: null,
    bestPart: null,
    bestPartTimestamp: null,
    weakestPart: null,
    weakestTimestamp: null,
    additionalNotes: null,
    addressedArtistNote: null,
    nextActions: null,
    timestamps: null,
    paidAmount: 0,
    artistRating: null,
    isGem: false,
    wasFlagged: false,
    flagReason: null,
    shareId: null,
    // v2 enhanced fields
    lowEndClarity: null,
    vocalClarity: null,
    highEndQuality: null,
    stereoWidth: null,
    dynamics: null,
    energyCurve: null,
    tooRepetitive: null,
    repetitiveNote: null,
    lostInterestAt: null,
    lostInterestReason: null,
    trackLength: null,
    emotionalImpact: null,
    memorableMoment: null,
    playlistAction: null,
    biggestWeaknessSpecific: null,
    quickWin: null,
    targetAudience: null,
    nextFocus: null,
    expectedPlacement: null,
    qualityLevel: null,
    reviewerExpertise: null,
    // v3 release decision fields
    releaseVerdict: null,
    releaseReadinessScore: null,
    topFixRank1: null,
    topFixRank1Impact: null,
    topFixRank1TimeMin: null,
    topFixRank2: null,
    topFixRank2Impact: null,
    topFixRank2TimeMin: null,
    topFixRank3: null,
    topFixRank3Impact: null,
    topFixRank3TimeMin: null,
    strongestElement: null,
    biggestRisk: null,
    competitiveBenchmark: null,
    // FIE fields
    textQualityScore: null,
    textSpecificity: null,
    textActionability: null,
    textTechnicalDepth: null,
    behavioralAlignment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: generateId(),
    trackId: generateId(),
    amount: 495,
    stripeSessionId: `cs_test_${generateId()}`,
    stripePaymentId: null,
    status: 'PENDING',
    createdAt: new Date(),
    completedAt: null,
    ...overrides,
  }
}

export function createMockReviewQueue(
  overrides: Partial<ReviewQueue> = {}
): ReviewQueue {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 48)

  return {
    id: generateId(),
    trackId: generateId(),
    reviewerId: generateId(),
    artistReviewerId: null,
    priority: 5,
    assignedAt: new Date(),
    expiresAt,
    ...overrides,
  }
}

// Helper to create a reviewer with user attached
export function createMockReviewerWithUser(
  reviewerOverrides: Partial<ReviewerProfile> = {},
  userOverrides: Partial<User> = {}
) {
  const user = createMockUser({ isReviewer: true, ...userOverrides })
  const reviewer = createMockReviewerProfile({
    userId: user.id,
    ...reviewerOverrides,
  })
  return { user, reviewer }
}

// Helper to create an artist with user attached
export function createMockArtistWithUser(
  artistOverrides: Partial<ArtistProfile> = {},
  userOverrides: Partial<User> = {}
) {
  const user = createMockUser({ isArtist: true, ...userOverrides })
  const artist = createMockArtistProfile({
    userId: user.id,
    ...artistOverrides,
  })
  return { user, artist }
}

// Reset ID counter between test files
export function resetFactoryIds() {
  idCounter = 0
}
