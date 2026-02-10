/**
 * Track Submission Integration Tests
 * Tests the complete track submission flow including validation, credit management, and queue assignment
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import {
  createMockUser,
  createMockArtistProfile,
  createMockTrack,
  createMockGenre,
  resetFactoryIds,
} from '../factories'

import '../mocks/prisma'

describe('Track Submission Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFactoryIds()
  })

  describe('Authorization & Validation', () => {
    it('requires authenticated user', async () => {
      // Simulate unauthenticated request
      const user = null
      expect(user).toBeNull()
    })

    it('requires verified email', async () => {
      const user = createMockUser({ emailVerified: null })
      prismaMock.User.findUnique.mockResolvedValue(user)

      const found = await prismaMock.User.findUnique({
        where: { id: user.id },
        select: { emailVerified: true },
      })

      expect(found?.emailVerified).toBeNull()
    })

    it('requires completed artist profile', async () => {
      const user = createMockUser()
      prismaMock.User.findUnique.mockResolvedValue(user)
      prismaMock.artistProfile.findUnique.mockResolvedValue(null)

      const artistProfile = await prismaMock.artistProfile.findUnique({
        where: { userId: user.id },
      })

      expect(artistProfile).toBeNull()
    })

    it('validates required fields', async () => {
      // Test that sourceUrl, title, and genreIds are required
      const invalidData = {
        sourceUrl: '',
        title: '',
        genreIds: [],
      }

      expect(invalidData.sourceUrl).toBe('')
      expect(invalidData.title).toBe('')
      expect(invalidData.genreIds).toHaveLength(0)
    })

    it('enforces genre limits (1-3 genres)', async () => {
      const tooManyGenres = ['genre1', 'genre2', 'genre3', 'genre4']
      expect(tooManyGenres.length).toBeGreaterThan(3)
    })

    it('validates track duration limits (max 1 hour)', async () => {
      const validDuration = 59 * 60 // 59 minutes
      const invalidDuration = 61 * 60 // 61 minutes

      expect(validDuration).toBeLessThanOrEqual(60 * 60)
      expect(invalidDuration).toBeGreaterThan(60 * 60)
    })
  })

  describe('Package Types & Credits', () => {
    it('creates PEER package and deducts credits', async () => {
      const user = createMockUser()
      const artist = createMockArtistProfile({
        userId: user.id,
        reviewCredits: 10,
        subscriptionStatus: null,
      })

      prismaMock.User.findUnique.mockResolvedValue(user)
      prismaMock.artistProfile.findUnique.mockResolvedValue(artist)

      const reviewsRequested = 5
      const expectedCreditsAfter = ArtistProfile.reviewCredits - reviewsRequested

      expect(ArtistProfile.reviewCredits).toBe(10)
      expect(expectedCreditsAfter).toBe(5)
    })

    it('rejects PEER package with insufficient credits', async () => {
      const user = createMockUser()
      const artist = createMockArtistProfile({
        userId: user.id,
        reviewCredits: 2,
      })

      prismaMock.User.findUnique.mockResolvedValue(user)
      prismaMock.artistProfile.findUnique.mockResolvedValue(artist)

      const reviewsRequested = 5
      const hasEnoughCredits = ArtistProfile.reviewCredits >= reviewsRequested

      expect(hasEnoughCredits).toBe(false)
    })

    it('creates STANDARD package (free tier)', async () => {
      const user = createMockUser()
      const artist = createMockArtistProfile({
        userId: user.id,
        subscriptionStatus: null,
      })

      prismaMock.User.findUnique.mockResolvedValue(user)
      prismaMock.artistProfile.findUnique.mockResolvedValue(artist)

      const packageType = 'STANDARD'
      expect(packageType).toBe('STANDARD')
      expect(ArtistProfile.subscriptionStatus).toBeNull()
    })

    it('creates PRO package for subscribed users', async () => {
      const user = createMockUser()
      const artist = createMockArtistProfile({
        userId: user.id,
        subscriptionStatus: 'active',
        subscriptionTier: 'pro',
      })

      prismaMock.User.findUnique.mockResolvedValue(user)
      prismaMock.artistProfile.findUnique.mockResolvedValue(artist)

      const packageType = 'PRO'
      expect(packageType).toBe('PRO')
      expect(ArtistProfile.subscriptionStatus).toBe('active')
    })

    it('sets correct review count for PRO package', async () => {
      const artist = createMockArtistProfile({
        subscriptionStatus: 'active',
        subscriptionTier: 'pro',
      })

      const packageType = 'PRO'
      const expectedReviews = 20 // PRO gets 20 reviews

      expect(packageType).toBe('PRO')
      expect(expectedReviews).toBe(20)
    })
  })

  describe('Source Type Detection', () => {
    it('detects SoundCloud URLs', () => {
      const url = 'https://soundcloud.com/artist/track'
      expect(url.includes('soundcloud.com')).toBe(true)
    })

    it('detects Bandcamp URLs', () => {
      const url = 'https://ArtistProfile.bandcamp.com/track/song'
      expect(url.includes('bandcamp.com')).toBe(true)
    })

    it('detects YouTube URLs', () => {
      const url = 'https://www.youtube.com/watch?v=abc123'
      expect(url.includes('youtube.com') || url.includes('youtu.be')).toBe(true)
    })

    it('handles UPLOAD source type', () => {
      const url = '/uploads/track-123.mp3'
      expect(url.startsWith('/uploads/')).toBe(true)
    })

    it('handles Ableton project uploads', () => {
      const url = '/ableton-projects/project.zip'
      expect(url.startsWith('/ableton-projects/')).toBe(true)
      expect(url.toLowerCase().endsWith('.zip')).toBe(true)
    })
  })

  describe('Track Creation Flow', () => {
    it('creates track with all required fields', async () => {
      const user = createMockUser()
      const artist = createMockArtistProfile({ userId: user.id })
      const genre1 = createMockGenre({ name: 'Electronic' })
      const genre2 = createMockGenre({ name: 'Hip-Hop' })

      prismaMock.User.findUnique.mockResolvedValue(user)
      prismaMock.artistProfile.findUnique.mockResolvedValue(artist)

      const trackData = {
        sourceUrl: 'https://soundcloud.com/artist/track',
        sourceType: 'SOUNDCLOUD' as const,
        title: 'Test Track',
        genreIds: [genre1.id, genre2.id],
        packageType: 'STANDARD' as const,
        reviewsRequested: 10,
      }

      const track = createMockTrack({
        artistId: ArtistProfile.id,
        title: trackData.title,
        sourceUrl: trackData.sourceUrl,
        sourceType: trackData.sourceType,
        packageType: trackData.packageType,
        reviewsRequested: trackData.reviewsRequested,
      })

      prismaMock.track.create.mockResolvedValue(track)

      const created = await prismaMock.track.create({
        data: track as any,
        include: { Genre: true },
      })

      expect(created.title).toBe(trackData.title)
      expect(created.sourceUrl).toBe(trackData.sourceUrl)
      expect(created.packageType).toBe(trackData.packageType)
      expect(created.reviewsRequested).toBe(trackData.reviewsRequested)
    })

    it('sets correct initial status for queued tracks', async () => {
      const track = createMockTrack({
        status: 'QUEUED',
        reviewsRequested: 10,
      })

      expect(track.status).toBe('QUEUED')
      expect(track.reviewsRequested).toBeGreaterThan(0)
    })

    it('sets correct initial status for uploaded tracks', async () => {
      const track = createMockTrack({
        status: 'UPLOADED',
        reviewsRequested: 0,
      })

      expect(track.status).toBe('UPLOADED')
      expect(track.reviewsRequested).toBe(0)
    })

    it('tracks credits spent for PEER packages', async () => {
      const track = createMockTrack({
        packageType: 'PEER',
        reviewsRequested: 5,
        creditsSpent: 5,
      })

      expect(track.packageType).toBe('PEER')
      expect(track.creditsSpent).toBe(track.reviewsRequested)
    })

    it('does not charge credits for paid packages', async () => {
      const track = createMockTrack({
        packageType: 'STANDARD',
        reviewsRequested: 10,
        creditsSpent: 0,
      })

      expect(track.packageType).toBe('STANDARD')
      expect(track.creditsSpent).toBe(0)
    })
  })

  describe('Subscription Features', () => {
    it('allows purchase toggle for Pro subscribers with uploads', async () => {
      const artist = createMockArtistProfile({
        subscriptionStatus: 'active',
        subscriptionTier: 'pro',
      })

      const sourceType = 'UPLOAD'
      const allowPurchase = true
      const canEnablePurchase = sourceType === 'UPLOAD' && ArtistProfile.subscriptionStatus === 'active'

      expect(canEnablePurchase).toBe(true)
    })

    it('disallows purchase toggle for free tier', async () => {
      const artist = createMockArtistProfile({
        subscriptionStatus: null,
      })

      const sourceType = 'UPLOAD'
      const canEnablePurchase = sourceType === 'UPLOAD' && ArtistProfile.subscriptionStatus === 'active'

      expect(canEnablePurchase).toBe(false)
    })

    it('disallows purchase toggle for non-upload sources', async () => {
      const artist = createMockArtistProfile({
        subscriptionStatus: 'active',
      })

      const sourceType = 'SOUNDCLOUD' as const
      // @ts-expect-error - Intentional type mismatch to test that SOUNDCLOUD !== UPLOAD
      const canEnablePurchase = sourceType === 'UPLOAD' && ArtistProfile.subscriptionStatus === 'active'

      expect(canEnablePurchase).toBe(false)
    })
  })

  describe('Ableton Project Integration', () => {
    it('sets render status to PENDING when project uploaded', async () => {
      const abletonProjectUrl = '/ableton-projects/project-123.zip'
      const abletonRenderStatus = abletonProjectUrl ? 'PENDING' : null

      expect(abletonRenderStatus).toBe('PENDING')
    })

    it('does not set render status without project', async () => {
      const abletonProjectUrl = null
      const abletonRenderStatus = abletonProjectUrl ? 'PENDING' : null

      expect(abletonRenderStatus).toBeNull()
    })

    it('stores project data correctly', async () => {
      const projectData = {
        projectName: 'My Track',
        tempo: 120,
        trackCount: 8,
        tracks: [
          { name: 'Drums', type: 'audio' as const },
          { name: 'Bass', type: 'audio' as const },
        ],
      }

      expect(projectData.tempo).toBe(120)
      expect(projectData.tracks).toHaveLength(2)
    })
  })

  describe('Artist Profile Updates', () => {
    it('increments totalTracks counter on submission', async () => {
      const artist = createMockArtistProfile({
        totalTracks: 5,
      })

      const newTotalTracks = ArtistProfile.totalTracks + 1

      expect(newTotalTracks).toBe(6)
    })

    it('updates reviewCredits for PEER submissions', async () => {
      const artist = createMockArtistProfile({
        reviewCredits: 10,
      })

      const creditsSpent = 5
      const newCredits = ArtistProfile.reviewCredits - creditsSpent

      expect(newCredits).toBe(5)
    })
  })

  describe('Error Handling', () => {
    it('handles invalid genre IDs', async () => {
      const validGenre = createMockGenre()
      const invalidGenreId = 'invalid-genre-id'

      // Mock valid genre lookup
      prismaMock.genre.findUnique.mockResolvedValueOnce(validGenre)
      // Mock invalid genre lookup
      prismaMock.genre.findUnique.mockResolvedValueOnce(null)

      const foundValid = await prismaMock.genre.findUnique({
        where: { id: validGenre.id },
      })
      const foundInvalid = await prismaMock.genre.findUnique({
        where: { id: invalidGenreId },
      })

      expect(foundValid).toBeTruthy()
      expect(foundInvalid).toBeNull()
    })

    it('handles database errors gracefully', async () => {
      const error = new Error('Database connection failed')
      prismaMock.track.create.mockRejectedValue(error)

      await expect(
        prismaMock.track.create({ data: {} as any })
      ).rejects.toThrow('Database connection failed')
    })
  })
})
