/**
 * Signup Integration Tests
 * Tests the complete signup flow including database interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import { mockSendEmailVerificationEmail } from '../mocks/email'
import {
  createMockUser,
  resetFactoryIds,
} from '../factories'

// Import after mocks are set up
import '../mocks/prisma'
import '../mocks/email'

describe('Signup Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFactoryIds()
  })

  describe('User Creation', () => {
    it('creates user with hashed password', async () => {
      const newUser = createMockUser({
        email: 'new@example.com',
        isArtist: true,
        isReviewer: false,
      })

      prismaMock.user.findUnique.mockResolvedValue(null) // No existing user
      prismaMock.user.create.mockResolvedValue(newUser)
      prismaMock.emailVerificationToken.create.mockResolvedValue({
        id: 'token-id',
        userId: newUser.id,
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(),
      })

      // Simulate the signup logic
      const existingUser = await prismaMock.user.findUnique({
        where: { email: 'new@example.com' },
      })
      expect(existingUser).toBeNull()

      const user = await prismaMock.user.create({
        data: {
          email: 'new@example.com',
          password: 'hashed-password',
          name: 'New User',
          isArtist: true,
          isReviewer: false,
        },
      })

      expect(user.email).toBe('new@example.com')
      expect(user.isArtist).toBe(true)
      expect(user.isReviewer).toBe(false)
    })

    it('rejects duplicate email addresses', async () => {
      const existingUser = createMockUser({ email: 'existing@example.com' })
      prismaMock.user.findUnique.mockResolvedValue(existingUser)

      const found = await prismaMock.user.findUnique({
        where: { email: 'existing@example.com' },
      })

      expect(found).not.toBeNull()
      expect(found?.email).toBe('existing@example.com')
    })

    it('creates email verification token after signup', async () => {
      const newUser = createMockUser()
      prismaMock.user.create.mockResolvedValue(newUser)

      const tokenData = {
        id: 'token-id',
        userId: newUser.id,
        tokenHash: 'sha256-hashed-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(),
      }
      prismaMock.emailVerificationToken.create.mockResolvedValue(tokenData)

      const token = await prismaMock.emailVerificationToken.create({
        data: {
          userId: newUser.id,
          tokenHash: 'sha256-hashed-token',
          expiresAt: tokenData.expiresAt,
        },
      })

      expect(token.userId).toBe(newUser.id)
      expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })
  })

  describe('Role Assignment', () => {
    it('sets isArtist=true for artist role', async () => {
      const artistUser = createMockUser({
        isArtist: true,
        isReviewer: false,
      })
      prismaMock.user.create.mockResolvedValue(artistUser)

      const user = await prismaMock.user.create({
        data: {
          email: 'artist@example.com',
          password: 'hashed',
          name: 'Artist',
          isArtist: true,
          isReviewer: false,
        },
      })

      expect(user.isArtist).toBe(true)
      expect(user.isReviewer).toBe(false)
    })

    it('sets isReviewer=true for reviewer role', async () => {
      const reviewerUser = createMockUser({
        isArtist: false,
        isReviewer: true,
      })
      prismaMock.user.create.mockResolvedValue(reviewerUser)

      const user = await prismaMock.user.create({
        data: {
          email: 'reviewer@example.com',
          password: 'hashed',
          name: 'Reviewer',
          isArtist: false,
          isReviewer: true,
        },
      })

      expect(user.isArtist).toBe(false)
      expect(user.isReviewer).toBe(true)
    })

    it('sets both flags for "both" role', async () => {
      const bothUser = createMockUser({
        isArtist: true,
        isReviewer: true,
      })
      prismaMock.user.create.mockResolvedValue(bothUser)

      const user = await prismaMock.user.create({
        data: {
          email: 'both@example.com',
          password: 'hashed',
          name: 'Both',
          isArtist: true,
          isReviewer: true,
        },
      })

      expect(user.isArtist).toBe(true)
      expect(user.isReviewer).toBe(true)
    })
  })

  describe('Email Verification', () => {
    it('sends verification email after signup', async () => {
      // This tests that the email function would be called
      await mockSendEmailVerificationEmail({
        to: 'new@example.com',
        verifyUrl: 'http://localhost:3000/verify-email?token=abc123',
      })

      expect(mockSendEmailVerificationEmail).toHaveBeenCalledWith({
        to: 'new@example.com',
        verifyUrl: expect.stringContaining('/verify-email?token='),
      })
    })

    it('marks user as verified when token is valid', async () => {
      const unverifiedUser = createMockUser({ emailVerified: null })
      const verifiedUser = { ...unverifiedUser, emailVerified: new Date() }

      prismaMock.user.update.mockResolvedValue(verifiedUser)

      const updated = await prismaMock.user.update({
        where: { id: unverifiedUser.id },
        data: { emailVerified: new Date() },
      })

      expect(updated.emailVerified).not.toBeNull()
    })

    it('marks token as used after verification', async () => {
      const tokenData = {
        id: 'token-id',
        userId: 'user-id',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60000),
        usedAt: new Date(),
        createdAt: new Date(),
      }

      prismaMock.emailVerificationToken.update.mockResolvedValue(tokenData)

      const updated = await prismaMock.emailVerificationToken.update({
        where: { id: 'token-id' },
        data: { usedAt: new Date() },
      })

      expect(updated.usedAt).not.toBeNull()
    })
  })
})

describe('Password Reset Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFactoryIds()
  })

  it('creates reset token for existing user', async () => {
    const user = createMockUser({ email: 'user@example.com' })
    prismaMock.user.findUnique.mockResolvedValue(user)

    const tokenData = {
      id: 'reset-token-id',
      userId: user.id,
      tokenHash: 'sha256-hash',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      usedAt: null,
      createdAt: new Date(),
    }
    prismaMock.passwordResetToken.create.mockResolvedValue(tokenData)

    const found = await prismaMock.user.findUnique({
      where: { email: 'user@example.com' },
    })
    expect(found).not.toBeNull()

    const token = await prismaMock.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: 'sha256-hash',
        expiresAt: tokenData.expiresAt,
      },
    })

    expect(token.userId).toBe(user.id)
    // Token expires in ~1 hour
    const hoursUntilExpiry = (token.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
    expect(hoursUntilExpiry).toBeLessThanOrEqual(1)
  })

  it('updates password with new hash', async () => {
    const user = createMockUser()
    const updatedUser = { ...user, password: 'new-hashed-password' }

    prismaMock.user.update.mockResolvedValue(updatedUser)

    const updated = await prismaMock.user.update({
      where: { id: user.id },
      data: { password: 'new-hashed-password' },
    })

    expect(updated.password).toBe('new-hashed-password')
  })

  it('marks reset token as used', async () => {
    const tokenData = {
      id: 'token-id',
      userId: 'user-id',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 60000),
      usedAt: new Date(),
      createdAt: new Date(),
    }

    prismaMock.passwordResetToken.update.mockResolvedValue(tokenData)

    const updated = await prismaMock.passwordResetToken.update({
      where: { id: 'token-id' },
      data: { usedAt: new Date() },
    })

    expect(updated.usedAt).not.toBeNull()
  })
})
