/**
 * Test Data Factories
 * Creates mock data for testing with sensible defaults
 */

import type { ReviewerTier } from '@prisma/client'
import type {
  User,
  ArtistProfile,
  ListenerProfile,
  Track,
  Review,
  Genre,
  Payment,
  ReviewQueue,
} from '@prisma/client'

// Alias for backwards compatibility in tests
type ReviewerProfile = ListenerProfile;

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
    spotifyId: null,
    lastfmUsername: null,
    stripeAccountId: null,
    onboardingQuizScore: 0,
    onboardingQuizPassed: true,
    onboardingQuizCompletedAt: new Date(),
    gemCount: 0,
    flagCount: 0,
    isRestricted: false,
    completedOnboarding: true,
    reviewsToday: 0,
    lastReviewDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as any
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
    status: 'QUEUED',
    packageType: 'STANDARD',
    reviewsRequested: 10,
    reviewsCompleted: 0,
    promoCode: null,
    createdAt: new Date(),
    paidAt: new Date(),
    completedAt: null,
    linkIssueNotifiedAt: null,
    ...overrides,
  } as any
}

export function createMockReview(overrides: Partial<Review> = {}): Review {
  return {
    id: generateId(),
    trackId: generateId(),
    reviewerId: generateId(),
    status: 'ASSIGNED',
    listenDuration: 0,
    lastHeartbeat: null,
    firstImpression: null,
    productionScore: null,
    vocalScore: null,
    originalityScore: null,
    wouldListenAgain: null,
    perceivedGenre: null,
    similarArtists: null,
    bestPart: null,
    bestPartTimestamp: null,
    weakestPart: null,
    weakestTimestamp: null,
    additionalNotes: null,
    paidAmount: 0,
    artistRating: null,
    isGem: false,
    wasFlagged: false,
    flagReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as any
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
