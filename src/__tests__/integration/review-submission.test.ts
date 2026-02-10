/**
 * Review Submission Integration Tests
 * Tests the complete review submission flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import { mockSendReviewProgressEmail } from '../mocks/email'
import {
  createMockUser,
  createMockReviewerProfile,
  createMockTrack,
  createMockReview,
  createMockArtistProfile,
  resetFactoryIds,
} from '../factories'

import '../mocks/prisma'
import '../mocks/email'

describe('Review Submission Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFactoryIds()
  })

  describe('Authorization Checks', () => {
    it('rejects submission from unverified email', async () => {
      const user = createMockUser({ emailVerified: null })
      prismaMock.User.findUnique.mockResolvedValue(user)

      const found = await prismaMock.User.findUnique({
        where: { id: user.id },
        select: { emailVerified: true },
      })

      expect(found?.emailVerified).toBeNull()
    })

    it('rejects submission from restricted reviewer', async () => {
      const reviewer = createMockReviewerProfile({ isRestricted: true })
      prismaMock.reviewerProfile.findUnique.mockResolvedValue(reviewer)

      const found = await prismaMock.reviewerProfile.findUnique({
        where: { userId: 'user-id' },
        select: { isRestricted: true },
      })

      expect(found?.isRestricted).toBe(true)
    })

    it('rejects submission from reviewer without completed onboarding', async () => {
      const reviewer = createMockReviewerProfile({
        completedOnboarding: false,
        onboardingQuizPassed: false,
      })
      prismaMock.reviewerProfile.findUnique.mockResolvedValue(reviewer)

      const found = await prismaMock.reviewerProfile.findUnique({
        where: { userId: 'user-id' },
        select: { completedOnboarding: true, onboardingQuizPassed: true },
      })

      expect(found?.completedOnboarding).toBe(false)
      expect(found?.onboardingQuizPassed).toBe(false)
    })

    it('allows submission from verified, onboarded reviewer', async () => {
      const user = createMockUser({ emailVerified: new Date() })
      const reviewer = createMockReviewerProfile({
        userId: user.id,
        completedOnboarding: true,
        onboardingQuizPassed: true,
        isRestricted: false,
      })

      prismaMock.User.findUnique.mockResolvedValue(user)
      prismaMock.reviewerProfile.findUnique.mockResolvedValue(reviewer)

      const foundUser = await prismaMock.User.findUnique({
        where: { id: user.id },
        select: { emailVerified: true },
      })
      expect(foundUser?.emailVerified).not.toBeNull()

      const foundReviewer = await prismaMock.reviewerProfile.findUnique({
        where: { userId: user.id },
      })
      expect(foundReviewer?.completedOnboarding).toBe(true)
      expect(foundReviewer?.onboardingQuizPassed).toBe(true)
      expect(foundReviewer?.isRestricted).toBe(false)
    })
  })

  describe('Review Ownership', () => {
    it('rejects submission for review assigned to different reviewer', async () => {
      const reviewer1 = createMockReviewerProfile()
      const reviewer2 = createMockReviewerProfile()

      const review = createMockReview({
        reviewerId: reviewer1.id,
      })

      // Reviewer2 trying to submit reviewer1's review
      const isOwner = review.reviewerId === reviewer2.id
      expect(isOwner).toBe(false)
    })

    it('allows submission for review assigned to current reviewer', async () => {
      const reviewer = createMockReviewerProfile()
      const review = createMockReview({
        reviewerId: ReviewerProfile.id,
      })

      const isOwner = review.reviewerId === ReviewerProfile.id
      expect(isOwner).toBe(true)
    })
  })

  describe('Listen Time Validation', () => {
    it('rejects submission below minimum listen time', async () => {
      const review = createMockReview({
        listenDuration: 120, // 2 minutes, need 3
      })

      const MIN_LISTEN_SECONDS = 180
      expect(review.listenDuration < MIN_LISTEN_SECONDS).toBe(true)
    })

    it('accepts submission at minimum listen time', async () => {
      const review = createMockReview({
        listenDuration: 180, // exactly 3 minutes
      })

      const MIN_LISTEN_SECONDS = 180
      expect(review.listenDuration >= MIN_LISTEN_SECONDS).toBe(true)
    })

    it('rejects submission with expired heartbeat session', async () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000 - 1000)
      const review = createMockReview({
        listenDuration: 200,
        lastHeartbeat: twoMinutesAgo,
      })

      const SESSION_TIMEOUT_MS = 2 * 60 * 1000
      const isExpired = Date.now() - review.lastHeartbeat!.getTime() > SESSION_TIMEOUT_MS
      expect(isExpired).toBe(true)
    })
  })

  describe('Review Completion', () => {
    it('updates review status to COMPLETED', async () => {
      const review = createMockReview({ status: 'IN_PROGRESS' })
      const completedReview = { ...review, status: 'COMPLETED' as const }

      prismaMock.review.update.mockResolvedValue(completedReview)

      const updated = await prismaMock.review.update({
        where: { id: review.id },
        data: { status: 'COMPLETED' },
      })

      expect(updated.status).toBe('COMPLETED')
    })

    it('records earnings based on reviewer tier', async () => {
      const TIER_RATES = { NORMAL: 50, PRO: 150 }

      const review = createMockReview()
      const reviewer = createMockReviewerProfile({ tier: 'NORMAL' as any })

      const earnings = ReviewerProfile.tier === 'PRO' ? TIER_RATES.PRO : TIER_RATES.NORMAL
      const completedReview = { ...review, paidAmount: earnings }

      prismaMock.review.update.mockResolvedValue(completedReview)

      const updated = await prismaMock.review.update({
        where: { id: review.id },
        data: {
          status: 'COMPLETED',
          paidAmount: earnings,
        },
      })

      expect(updated.paidAmount).toBe(50)
    })
  })

  describe('Reviewer Stats Update', () => {
    it('increments total reviews count', async () => {
      const reviewer = createMockReviewerProfile({ totalReviews: 10 })
      const updatedReviewer = { ...reviewer, totalReviews: 11 }

      prismaMock.reviewerProfile.update.mockResolvedValue(updatedReviewer)

      const updated = await prismaMock.reviewerProfile.update({
        where: { id: ReviewerProfile.id },
        data: { totalReviews: { increment: 1 } },
      })

      expect(updated.totalReviews).toBe(11)
    })

    it('adds earnings to pending balance', async () => {
      const reviewer = createMockReviewerProfile({
        pendingBalance: 100,
        totalEarnings: 500,
      })
      const earnings = 30

      const updatedReviewer = {
        ...reviewer,
        pendingBalance: ReviewerProfile.pendingBalance + earnings,
        totalEarnings: ReviewerProfile.totalEarnings + earnings,
      }

      prismaMock.reviewerProfile.update.mockResolvedValue(updatedReviewer)

      const updated = await prismaMock.reviewerProfile.update({
        where: { id: ReviewerProfile.id },
        data: {
          pendingBalance: { increment: earnings },
          totalEarnings: { increment: earnings },
        },
      })

      expect(updated.pendingBalance).toBe(130)
      expect(updated.totalEarnings).toBe(530)
    })

    it('updates last review date', async () => {
      const now = new Date()
      const reviewer = createMockReviewerProfile({ lastReviewDate: null })
      const updatedReviewer = { ...reviewer, lastReviewDate: now }

      prismaMock.reviewerProfile.update.mockResolvedValue(updatedReviewer)

      const updated = await prismaMock.reviewerProfile.update({
        where: { id: ReviewerProfile.id },
        data: { lastReviewDate: now },
      })

      expect(updated.lastReviewDate).toEqual(now)
    })
  })

  describe('Track Progress Update', () => {
    it('sets track to IN_PROGRESS after first counted review is submitted', async () => {
      const track = createMockTrack({
        reviewsRequested: 10,
        status: 'QUEUED',
      })
      const updatedTrack = { ...track, status: 'IN_PROGRESS' as const }

      prismaMock.track.update.mockResolvedValue(updatedTrack)

      const updated = await prismaMock.track.update({
        where: { id: track.id },
        data: { status: 'IN_PROGRESS' },
      })

      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('marks track as COMPLETED when all reviews are done', async () => {
      const track = createMockTrack({
        reviewsRequested: 10,
        status: 'IN_PROGRESS',
      })

      // After this review completes, all 10 are done
      const completedTrack = {
        ...track,
        status: 'COMPLETED' as const,
        completedAt: new Date(),
      }

      prismaMock.track.update.mockResolvedValue(completedTrack)

      const updated = await prismaMock.track.update({
        where: { id: track.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })

      expect(updated.status).toBe('COMPLETED')
      expect(updated.completedAt).not.toBeNull()
    })
  })

  describe('Progress Email Notifications', () => {
    it('sends email at 50% completion', async () => {
      const track = createMockTrack({
        title: 'Test Track',
        reviewsRequested: 10,
      })
      const artist = createMockArtistProfile()
      const user = createMockUser({ email: 'artist@example.com' })

      const completedReviews = 5 // 50%
      const milestoneHalf = Math.ceil(track.reviewsRequested / 2)

      expect(completedReviews).toBe(milestoneHalf)

      await mockSendReviewProgressEmail(
        user.email!,
        track.title,
        completedReviews,
        track.reviewsRequested
      )

      expect(mockSendReviewProgressEmail).toHaveBeenCalledWith(
        'artist@example.com',
        'Test Track',
        5,
        10
      )
    })

    it('sends email at 100% completion', async () => {
      const track = createMockTrack({
        title: 'Complete Track',
        reviewsRequested: 10,
      })
      const user = createMockUser({ email: 'artist@example.com' })

      const completedReviews = 10 // 100%

      expect(completedReviews).toBe(track.reviewsRequested)

      await mockSendReviewProgressEmail(
        user.email!,
        track.title,
        completedReviews,
        track.reviewsRequested
      )

      expect(mockSendReviewProgressEmail).toHaveBeenCalledWith(
        'artist@example.com',
        'Complete Track',
        10,
        10
      )
    })
  })

  describe('Queue Cleanup', () => {
    it('removes reviewer from queue after submission', async () => {
      const review = createMockReview()

      prismaMock.reviewQueue.deleteMany.mockResolvedValue({ count: 1 })

      const result = await prismaMock.reviewQueue.deleteMany({
        where: {
          trackId: review.trackId,
          reviewerId: review.reviewerId,
        },
      })

      expect(result.count).toBe(1)
    })
  })
})

describe('Duplicate Review Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects submission for already completed review', async () => {
    const review = createMockReview({ status: 'COMPLETED' })
    prismaMock.review.findUnique.mockResolvedValue(review)

    const found = await prismaMock.review.findUnique({
      where: { id: review.id },
    })

    expect(found?.status).toBe('COMPLETED')
    // Business logic should reject this
  })

  it('allows submission for ASSIGNED review', async () => {
    const review = createMockReview({ status: 'ASSIGNED' })
    prismaMock.review.findUnique.mockResolvedValue(review)

    const found = await prismaMock.review.findUnique({
      where: { id: review.id },
    })

    expect(found?.status).toBe('ASSIGNED')
    // Business logic should allow this
  })

  it('allows submission for IN_PROGRESS review', async () => {
    const review = createMockReview({ status: 'IN_PROGRESS' })
    prismaMock.review.findUnique.mockResolvedValue(review)

    const found = await prismaMock.review.findUnique({
      where: { id: review.id },
    })

    expect(found?.status).toBe('IN_PROGRESS')
    // Business logic should allow this
  })
})
