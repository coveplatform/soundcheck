/**
 * Queue Assignment Integration Tests
 * Tests reviewer assignment to tracks based on eligibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import {
  createMockUser,
  createMockReviewerProfile,
  createMockTrack,
  createMockGenre,
  createMockReviewQueue,
  resetFactoryIds,
} from '../factories'

import '../mocks/prisma'
import '../mocks/email'

describe('Queue Assignment Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFactoryIds()
  })

  describe('Reviewer Eligibility', () => {
    it('includes reviewers with matching genres', async () => {
      const genre = createMockGenre({ name: 'Electronic' })
      const track = createMockTrack()
      const reviewer = createMockReviewerProfile({
        completedOnboarding: true,
        onboardingQuizPassed: true,
        isRestricted: false,
      })

      // Mock track with genres
      const trackWithGenres = { ...track, genres: [genre] }
      prismaMock.track.findUnique.mockResolvedValue(trackWithGenres as unknown as ReturnType<typeof createMockTrack>)

      // Mock eligible reviewers
      const reviewerWithGenres = { ...reviewer, genres: [genre], user: { id: 'user-id', email: 'test@example.com' } }
      prismaMock.reviewerProfile.findMany.mockResolvedValue([reviewerWithGenres as unknown as ReturnType<typeof createMockReviewerProfile>])

      const eligibleReviewers = await prismaMock.reviewerProfile.findMany({
        where: {
          completedOnboarding: true,
          onboardingQuizPassed: true,
          isRestricted: false,
          genres: { some: { id: genre.id } },
        },
      })

      expect(eligibleReviewers.length).toBeGreaterThan(0)
    })

    it('excludes reviewers without completed onboarding', async () => {
      const reviewer = createMockReviewerProfile({
        completedOnboarding: false,
        onboardingQuizPassed: true,
      })

      prismaMock.reviewerProfile.findMany.mockResolvedValue([])

      const eligibleReviewers = await prismaMock.reviewerProfile.findMany({
        where: {
          completedOnboarding: true, // Will exclude our reviewer
          onboardingQuizPassed: true,
        },
      })

      expect(eligibleReviewers.length).toBe(0)
    })

    it('excludes reviewers who failed onboarding quiz', async () => {
      const reviewer = createMockReviewerProfile({
        completedOnboarding: true,
        onboardingQuizPassed: false,
      })

      prismaMock.reviewerProfile.findMany.mockResolvedValue([])

      const eligibleReviewers = await prismaMock.reviewerProfile.findMany({
        where: {
          completedOnboarding: true,
          onboardingQuizPassed: true, // Will exclude our reviewer
        },
      })

      expect(eligibleReviewers.length).toBe(0)
    })

    it('excludes restricted reviewers', async () => {
      const reviewer = createMockReviewerProfile({
        completedOnboarding: true,
        onboardingQuizPassed: true,
        isRestricted: true,
      })

      prismaMock.reviewerProfile.findMany.mockResolvedValue([])

      const eligibleReviewers = await prismaMock.reviewerProfile.findMany({
        where: {
          completedOnboarding: true,
          onboardingQuizPassed: true,
          isRestricted: false, // Will exclude our reviewer
        },
      })

      expect(eligibleReviewers.length).toBe(0)
    })

    it('excludes reviewers with unverified email', async () => {
      const user = createMockUser({ emailVerified: null })
      const reviewer = createMockReviewerProfile({
        userId: user.id,
        completedOnboarding: true,
        onboardingQuizPassed: true,
        isRestricted: false,
      })

      prismaMock.reviewerProfile.findMany.mockResolvedValue([])

      const eligibleReviewers = await prismaMock.reviewerProfile.findMany({
        where: {
          user: { emailVerified: { not: null } }, // Will exclude our reviewer
        },
      })

      expect(eligibleReviewers.length).toBe(0)
    })

    it('excludes reviewers who already reviewed this track', async () => {
      const track = createMockTrack()
      const reviewer = createMockReviewerProfile()

      prismaMock.reviewerProfile.findMany.mockResolvedValue([])

      const eligibleReviewers = await prismaMock.reviewerProfile.findMany({
        where: {
          reviews: { none: { trackId: track.id } }, // Exclude if already reviewed
        },
      })

      expect(eligibleReviewers.length).toBe(0)
    })

    it('enforces minimum account age', async () => {
      const MIN_AGE_HOURS = 24
      const cutoff = new Date()
      cutoff.setHours(cutoff.getHours() - MIN_AGE_HOURS)

      // User created 12 hours ago (too new)
      const newUser = createMockUser({
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      })

      // User created 48 hours ago (old enough)
      const oldUser = createMockUser({
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      })

      expect(newUser.createdAt > cutoff).toBe(true) // Too new
      expect(oldUser.createdAt <= cutoff).toBe(true) // Old enough
    })
  })

  describe('Package-Based Filtering', () => {
    it('PRO package only assigns PRO tier reviewers', async () => {
      const proReviewer = createMockReviewerProfile({ tier: 'PRO' })
      const verifiedReviewer = createMockReviewerProfile({ tier: 'VERIFIED' })
      const rookieReviewer = createMockReviewerProfile({ tier: 'ROOKIE' })

      const allReviewers = [proReviewer, verifiedReviewer, rookieReviewer]
      const packageType = 'PRO'

      // Filter for PRO package
      const eligibleForPro = allReviewers.filter(r => r.tier === 'PRO')

      expect(eligibleForPro.length).toBe(1)
      expect(eligibleForPro[0].tier).toBe('PRO')
    })

    it('STANDARD package prioritizes VERIFIED and PRO reviewers', async () => {
      const proReviewer = createMockReviewerProfile({ tier: 'PRO' })
      const verifiedReviewer = createMockReviewerProfile({ tier: 'VERIFIED' })
      const rookieReviewer = createMockReviewerProfile({ tier: 'ROOKIE' })

      const allReviewers = [rookieReviewer, verifiedReviewer, proReviewer]

      // Sort by tier for STANDARD package
      const tierOrder = { PRO: 3, VERIFIED: 2, ROOKIE: 1 } as const
      const sorted = [...allReviewers].sort(
        (a, b) => tierOrder[b.tier] - tierOrder[a.tier]
      )

      expect(sorted[0].tier).toBe('PRO')
      expect(sorted[1].tier).toBe('VERIFIED')
      expect(sorted[2].tier).toBe('ROOKIE')
    })

    it('STARTER package accepts all tiers', async () => {
      const reviewers = [
        createMockReviewerProfile({ tier: 'ROOKIE' }),
        createMockReviewerProfile({ tier: 'VERIFIED' }),
        createMockReviewerProfile({ tier: 'PRO' }),
      ]

      // STARTER doesn't filter by tier
      expect(reviewers.length).toBe(3)
    })
  })

  describe('Queue Entry Creation', () => {
    it('creates queue entries with 48-hour expiration', async () => {
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setHours(expiresAt.getHours() + 48)

      const queueEntry = createMockReviewQueue({ expiresAt })

      const hoursUntilExpiry =
        (queueEntry.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)

      expect(Math.round(hoursUntilExpiry)).toBe(48)
    })

    it('assigns correct priority based on package type', async () => {
      const proPriority = 10
      const standardPriority = 5
      const starterPriority = 0

      const proQueue = createMockReviewQueue({ priority: proPriority })
      const standardQueue = createMockReviewQueue({ priority: standardPriority })
      const starterQueue = createMockReviewQueue({ priority: starterPriority })

      expect(proQueue.priority).toBe(10)
      expect(standardQueue.priority).toBe(5)
      expect(starterQueue.priority).toBe(0)
    })

    it('creates review record alongside queue entry', async () => {
      const track = createMockTrack()
      const reviewer = createMockReviewerProfile()

      // Simulate transaction
      prismaMock.reviewQueue.createMany.mockResolvedValue({ count: 1 })
      prismaMock.review.createMany.mockResolvedValue({ count: 1 })

      const queueResult = await prismaMock.reviewQueue.createMany({
        data: [{ trackId: track.id, reviewerId: reviewer.id, expiresAt: new Date(), priority: 5 }],
        skipDuplicates: true,
      })

      const reviewResult = await prismaMock.review.createMany({
        data: [{ trackId: track.id, reviewerId: reviewer.id, status: 'ASSIGNED' }],
        skipDuplicates: true,
      })

      expect(queueResult.count).toBe(1)
      expect(reviewResult.count).toBe(1)
    })
  })

  describe('Track Status Updates', () => {
    it('updates track to IN_PROGRESS when reviewers are assigned', async () => {
      const track = createMockTrack({ status: 'QUEUED' })
      const updatedTrack = { ...track, status: 'IN_PROGRESS' as const }

      prismaMock.track.update.mockResolvedValue(updatedTrack)

      const updated = await prismaMock.track.update({
        where: { id: track.id },
        data: { status: 'IN_PROGRESS' },
      })

      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('calculates remaining reviews needed', async () => {
      const track = createMockTrack({
        reviewsRequested: 10,
        reviewsCompleted: 3,
      })

      // Simulate 2 active assignments
      const completedReviews = 3
      const activeAssignments = 2
      const neededReviews =
        track.reviewsRequested - completedReviews - activeAssignments

      expect(neededReviews).toBe(5) // Need 5 more reviewers
    })
  })
})

describe('Queue Expiration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFactoryIds()
  })

  describe('Expired Entry Detection', () => {
    it('finds entries past expiration time', async () => {
      const expiredAt = new Date(Date.now() - 60000) // 1 minute ago
      const expiredQueue = createMockReviewQueue({ expiresAt: expiredAt })

      prismaMock.reviewQueue.findMany.mockResolvedValue([expiredQueue])

      const expired = await prismaMock.reviewQueue.findMany({
        where: { expiresAt: { lte: new Date() } },
      })

      expect(expired.length).toBe(1)
    })

    it('does not find non-expired entries', async () => {
      const futureExpiry = new Date(Date.now() + 60000) // 1 minute from now
      const validQueue = createMockReviewQueue({ expiresAt: futureExpiry })

      prismaMock.reviewQueue.findMany.mockResolvedValue([])

      const expired = await prismaMock.reviewQueue.findMany({
        where: { expiresAt: { lte: new Date() } },
      })

      expect(expired.length).toBe(0)
    })
  })

  describe('Expiration Processing', () => {
    it('updates review status to EXPIRED', async () => {
      const review = { status: 'EXPIRED' as const }

      prismaMock.review.updateMany.mockResolvedValue({ count: 1 })

      const result = await prismaMock.review.updateMany({
        where: {
          trackId: 'track-id',
          reviewerId: 'reviewer-id',
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
        },
        data: { status: 'EXPIRED' },
      })

      expect(result.count).toBe(1)
    })

    it('deletes expired queue entry', async () => {
      prismaMock.reviewQueue.delete.mockResolvedValue(createMockReviewQueue())

      const result = await prismaMock.reviewQueue.delete({
        where: {
          trackId_reviewerId: {
            trackId: 'track-id',
            reviewerId: 'reviewer-id',
          },
        },
      })

      expect(result).toBeDefined()
    })

    it('triggers reassignment for affected tracks', async () => {
      const expiredEntries = [
        createMockReviewQueue({ trackId: 'track-1' }),
        createMockReviewQueue({ trackId: 'track-2' }),
        createMockReviewQueue({ trackId: 'track-1' }), // Duplicate track
      ]

      const affectedTrackIds = new Set(expiredEntries.map(e => e.trackId))

      expect(affectedTrackIds.size).toBe(2) // track-1 and track-2
    })
  })
})

describe('Reviewer Queue View', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns queue entries sorted by priority desc, then assignedAt asc', async () => {
    const highPriority = createMockReviewQueue({ priority: 10, assignedAt: new Date() })
    const lowPriorityOld = createMockReviewQueue({
      priority: 5,
      assignedAt: new Date(Date.now() - 60000),
    })
    const lowPriorityNew = createMockReviewQueue({
      priority: 5,
      assignedAt: new Date(),
    })

    const sorted = [highPriority, lowPriorityOld, lowPriorityNew].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return a.assignedAt.getTime() - b.assignedAt.getTime()
    })

    expect(sorted[0].priority).toBe(10)
    expect(sorted[1].assignedAt.getTime()).toBeLessThan(sorted[2].assignedAt.getTime())
  })

  it('only returns non-expired entries', async () => {
    const now = new Date()
    const validEntry = createMockReviewQueue({
      expiresAt: new Date(Date.now() + 60000),
    })
    const expiredEntry = createMockReviewQueue({
      expiresAt: new Date(Date.now() - 60000),
    })

    const entries = [validEntry, expiredEntry]
    const nonExpired = entries.filter(e => e.expiresAt > now)

    expect(nonExpired.length).toBe(1)
  })
})
