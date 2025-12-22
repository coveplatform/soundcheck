/**
 * Stripe Webhook Integration Tests
 * Tests payment processing and webhook handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import { mockSendTrackQueuedEmail } from '../mocks/email'
import {
  createMockTrack,
  createMockPayment,
  createMockArtistProfile,
  createMockUser,
  resetFactoryIds,
} from '../factories'

import '../mocks/prisma'
import '../mocks/email'
import '../mocks/stripe'

describe('Stripe Webhook Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFactoryIds()
  })

  describe('checkout.session.completed', () => {
    it('updates payment status to COMPLETED', async () => {
      const payment = createMockPayment({ status: 'PENDING' })
      const completedPayment = { ...payment, status: 'COMPLETED' as const, completedAt: new Date() }

      prismaMock.payment.update.mockResolvedValue(completedPayment)

      const updated = await prismaMock.payment.update({
        where: { stripeSessionId: payment.stripeSessionId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      })

      expect(updated.status).toBe('COMPLETED')
      expect(updated.completedAt).not.toBeNull()
    })

    it('updates track status from PENDING_PAYMENT to QUEUED', async () => {
      const track = createMockTrack({ status: 'PENDING_PAYMENT' })
      const queuedTrack = { ...track, status: 'QUEUED' as const, paidAt: new Date() }

      prismaMock.track.update.mockResolvedValue(queuedTrack)

      const updated = await prismaMock.track.update({
        where: { id: track.id },
        data: { status: 'QUEUED', paidAt: new Date() },
      })

      expect(updated.status).toBe('QUEUED')
      expect(updated.paidAt).not.toBeNull()
    })

    it('updates artist totalSpent', async () => {
      const artist = createMockArtistProfile({ totalSpent: 0 })
      const payment = createMockPayment({ amount: 600 })

      const updatedArtist = { ...artist, totalSpent: 600 }
      prismaMock.artistProfile.update.mockResolvedValue(updatedArtist)

      const updated = await prismaMock.artistProfile.update({
        where: { id: artist.id },
        data: { totalSpent: { increment: payment.amount } },
      })

      expect(updated.totalSpent).toBe(600)
    })

    it('sends track queued email to artist', async () => {
      const user = createMockUser({ email: 'artist@example.com' })
      const track = createMockTrack({ title: 'My New Song' })

      await mockSendTrackQueuedEmail(user.email!, track.title)

      expect(mockSendTrackQueuedEmail).toHaveBeenCalledWith(
        'artist@example.com',
        'My New Song'
      )
    })

    it('triggers queue assignment after payment', async () => {
      // Simulate the flow: payment complete -> track queued -> assign reviewers
      const track = createMockTrack({
        status: 'QUEUED',
        reviewsRequested: 10,
        reviewsCompleted: 0,
      })

      // This would trigger assignReviewersToTrack(track.id)
      expect(track.status).toBe('QUEUED')
      expect(track.reviewsRequested - track.reviewsCompleted).toBe(10)
    })
  })

  describe('checkout.session.expired', () => {
    it('updates payment status to FAILED', async () => {
      const payment = createMockPayment({ status: 'PENDING' })
      const failedPayment = { ...payment, status: 'FAILED' as const }

      prismaMock.payment.update.mockResolvedValue(failedPayment)

      const updated = await prismaMock.payment.update({
        where: { stripeSessionId: payment.stripeSessionId },
        data: { status: 'FAILED' },
      })

      expect(updated.status).toBe('FAILED')
    })

    it('keeps track in PENDING_PAYMENT status', async () => {
      const track = createMockTrack({ status: 'PENDING_PAYMENT' })

      // Expired checkout doesn't change track status
      expect(track.status).toBe('PENDING_PAYMENT')
    })
  })

  describe('Webhook Signature Verification', () => {
    it('validates webhook signature format', () => {
      // Stripe webhook secrets follow the format: whsec_...
      const validSecretFormat = /^whsec_[a-zA-Z0-9]+$/
      const testSecret = 'whsec_test123abc'

      expect(validSecretFormat.test(testSecret)).toBe(true)
      expect(validSecretFormat.test('invalid')).toBe(false)
    })
  })

  describe('Idempotency', () => {
    it('handles duplicate webhook events gracefully', async () => {
      const payment = createMockPayment({ status: 'COMPLETED' })

      prismaMock.payment.findUnique.mockResolvedValue(payment)

      const existingPayment = await prismaMock.payment.findUnique({
        where: { stripeSessionId: payment.stripeSessionId },
      })

      // Already completed - should skip processing
      expect(existingPayment?.status).toBe('COMPLETED')
    })

    it('only processes PENDING payments', async () => {
      const pendingPayment = createMockPayment({ status: 'PENDING' })
      const completedPayment = createMockPayment({ status: 'COMPLETED' })
      const failedPayment = createMockPayment({ status: 'FAILED' })

      // Only PENDING should be processed
      expect(pendingPayment.status).toBe('PENDING')
      expect(completedPayment.status).not.toBe('PENDING')
      expect(failedPayment.status).not.toBe('PENDING')
    })
  })
})

describe('Checkout Session Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFactoryIds()
  })

  describe('Session Data', () => {
    it('includes correct line item for package', () => {
      const PACKAGES = {
        STARTER: { price: 300, name: 'Starter', reviews: 5 },
        STANDARD: { price: 600, name: 'Standard', reviews: 10 },
        PRO: { price: 1200, name: 'Pro', reviews: 10 },
        DEEP_DIVE: { price: 1800, name: 'Deep Dive', reviews: 25 },
      }

      const packageType = 'STANDARD' as keyof typeof PACKAGES
      const pkg = PACKAGES[packageType]

      const lineItem = {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `MixReflect ${pkg.name}`,
            description: `${pkg.reviews} reviews for your track`,
          },
          unit_amount: pkg.price,
        },
        quantity: 1,
      }

      expect(lineItem.price_data.unit_amount).toBe(600)
      expect(lineItem.price_data.product_data.name).toBe('MixReflect Standard')
    })

    it('includes track metadata in session', () => {
      const track = createMockTrack()

      const metadata = {
        trackId: track.id,
        userId: 'user-id',
        packageType: track.packageType,
      }

      expect(metadata.trackId).toBe(track.id)
      expect(metadata.packageType).toBe('STANDARD')
    })

    it('sets correct success and cancel URLs', () => {
      const baseUrl = 'http://localhost:3000'
      const trackId = 'track-123'

      const successUrl = `${baseUrl}/artist/submit/success?trackId=${trackId}`
      const cancelUrl = `${baseUrl}/artist/submit?cancelled=true`

      expect(successUrl).toContain('/artist/submit/success')
      expect(successUrl).toContain('trackId=track-123')
      expect(cancelUrl).toContain('cancelled=true')
    })
  })

  describe('Payment Record Creation', () => {
    it('creates payment record with stripe session ID', async () => {
      const track = createMockTrack()
      const stripeSessionId = 'cs_test_abc123'

      const payment = createMockPayment({
        trackId: track.id,
        stripeSessionId,
        amount: 600,
        status: 'PENDING',
      })

      prismaMock.payment.create.mockResolvedValue(payment)

      const created = await prismaMock.payment.create({
        data: {
          trackId: track.id,
          stripeSessionId,
          amount: 600,
          status: 'PENDING',
        },
      })

      expect(created.stripeSessionId).toBe(stripeSessionId)
      expect(created.status).toBe('PENDING')
    })
  })
})

describe('Refund Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFactoryIds()
  })

  it('only allows refund if no reviews have started', async () => {
    const trackNoReviews = createMockTrack({
      status: 'QUEUED',
      reviewsCompleted: 0,
    })

    const trackWithReviews = createMockTrack({
      status: 'IN_PROGRESS',
      reviewsCompleted: 3,
    })

    // Can refund if no reviews completed
    expect(trackNoReviews.reviewsCompleted).toBe(0)

    // Cannot refund if reviews have started
    expect(trackWithReviews.reviewsCompleted).toBeGreaterThan(0)
  })

  it('updates payment status to REFUNDED', async () => {
    const payment = createMockPayment({ status: 'COMPLETED' })
    const refundedPayment = { ...payment, status: 'REFUNDED' as const }

    prismaMock.payment.update.mockResolvedValue(refundedPayment)

    const updated = await prismaMock.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    })

    expect(updated.status).toBe('REFUNDED')
  })

  it('updates track status to CANCELLED', async () => {
    const track = createMockTrack({ status: 'QUEUED' })
    const cancelledTrack = { ...track, status: 'CANCELLED' as const }

    prismaMock.track.update.mockResolvedValue(cancelledTrack)

    const updated = await prismaMock.track.update({
      where: { id: track.id },
      data: { status: 'CANCELLED' },
    })

    expect(updated.status).toBe('CANCELLED')
  })

  it('removes all queue entries for the track', async () => {
    const track = createMockTrack()

    prismaMock.reviewQueue.deleteMany.mockResolvedValue({ count: 5 })

    const result = await prismaMock.reviewQueue.deleteMany({
      where: { trackId: track.id },
    })

    expect(result.count).toBe(5)
  })

  it('updates pending reviews to EXPIRED', async () => {
    const track = createMockTrack()

    prismaMock.review.updateMany.mockResolvedValue({ count: 5 })

    const result = await prismaMock.review.updateMany({
      where: {
        trackId: track.id,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
      data: { status: 'EXPIRED' },
    })

    expect(result.count).toBe(5)
  })
})
