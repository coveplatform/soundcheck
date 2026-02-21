/**
 * Metadata & Package Tests
 * Tests URL detection, validation, and package configuration
 */

import { describe, it, expect } from 'vitest'
import {
  detectSource,
  validateTrackUrl,
  fetchTrackMetadata,
  PACKAGES,
} from '@/lib/metadata'

describe('URL Source Detection', () => {
  describe('detectSource', () => {
    it('detects SoundCloud URLs', () => {
      const soundcloudUrls = [
        'https://soundcloud.com/artist/track',
        'https://www.soundcloud.com/artist/track-name',
        'http://soundcloud.com/user/song',
        'https://m.soundcloud.com/artist/track',
      ]

      soundcloudUrls.forEach(url => {
        expect(detectSource(url)).toBe('SOUNDCLOUD')
      })
    })

    it('detects Bandcamp URLs', () => {
      const bandcampUrls = [
        'https://ArtistProfile.bandcamp.com/track/song-name',
        'https://label.bandcamp.com/album/album-name',
        'http://music.bandcamp.com/track/test',
      ]

      bandcampUrls.forEach(url => {
        expect(detectSource(url)).toBe('BANDCAMP')
      })
    })

    it('detects YouTube URLs', () => {
      const youtubeUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=abc123',
        'https://youtu.be/dQw4w9WgXcQ',
        'http://www.youtube.com/watch?v=xyz',
      ]

      youtubeUrls.forEach(url => {
        expect(detectSource(url)).toBe('YOUTUBE')
      })
    })

    it('returns null for unsupported URLs', () => {
      const unsupportedUrls = [
        'https://spotify.com/track/abc',
        'https://apple.com/music/song',
        'https://tidal.com/track',
        'https://example.com',
        'not-a-url',
      ]

      unsupportedUrls.forEach(url => {
        expect(detectSource(url)).toBeNull()
      })
    })

    it('handles invalid URLs gracefully', () => {
      expect(detectSource('')).toBeNull()
      expect(detectSource('not a url')).toBeNull()
      expect(detectSource('ftp://soundcloud.com')).toBe('SOUNDCLOUD') // Still detects domain
    })
  })
})

describe('URL Validation', () => {
  describe('validateTrackUrl', () => {
    it('accepts valid SoundCloud URL', () => {
      const result = validateTrackUrl('https://soundcloud.com/artist/track')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('accepts valid Bandcamp URL', () => {
      const result = validateTrackUrl('https://ArtistProfile.bandcamp.com/track/song')
      expect(result.valid).toBe(true)
    })

    it('accepts valid YouTube URL', () => {
      const result = validateTrackUrl('https://youtube.com/watch?v=abc123')
      expect(result.valid).toBe(true)
    })

    it('rejects empty URL', () => {
      const result = validateTrackUrl('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Please enter a URL')
    })

    it('rejects whitespace-only URL', () => {
      const result = validateTrackUrl('   ')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Please enter a URL')
    })

    it('rejects invalid URL format', () => {
      const result = validateTrackUrl('not-a-valid-url')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Please enter a valid URL')
    })

    it('rejects unsupported platforms', () => {
      const result = validateTrackUrl('https://spotify.com/track/123')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Please enter a SoundCloud, Bandcamp, or YouTube URL')
    })
  })
})

describe('Metadata Extraction', () => {
  describe('fetchTrackMetadata', () => {
    it('extracts title from SoundCloud URL', async () => {
      const metadata = await fetchTrackMetadata(
        'https://soundcloud.com/artist/my-awesome-track'
      )

      expect(metadata).not.toBeNull()
      expect(metadata?.source).toBe('SOUNDCLOUD')
      expect(metadata?.title).toBe('My Awesome Track')
    })

    it('extracts title from Bandcamp URL', async () => {
      const metadata = await fetchTrackMetadata(
        'https://ArtistProfile.bandcamp.com/track/cool-song-name'
      )

      expect(metadata).not.toBeNull()
      expect(metadata?.source).toBe('BANDCAMP')
      expect(metadata?.title).toBe('Cool Song Name')
    })

    it('extracts video ID from YouTube URL', async () => {
      const metadata = await fetchTrackMetadata(
        'https://youtube.com/watch?v=dQw4w9WgXcQ'
      )

      expect(metadata).not.toBeNull()
      expect(metadata?.source).toBe('YOUTUBE')
      expect(metadata?.title).toContain('dQw4w9WgXcQ')
    })

    it('returns null for unsupported URLs', async () => {
      const metadata = await fetchTrackMetadata('https://spotify.com/track/123')
      expect(metadata).toBeNull()
    })

    it('handles URLs with no path gracefully', async () => {
      const metadata = await fetchTrackMetadata('https://soundcloud.com/')
      expect(metadata).not.toBeNull()
      expect(metadata?.title).toBe('Untitled Track')
    })
  })
})

describe('Package Configuration', () => {
  describe('PACKAGES', () => {
    it('has all five package types', () => {
      expect(Object.keys(PACKAGES)).toEqual([
        'STARTER',
        'STANDARD',
        'PEER',
        'PRO',
        'DEEP_DIVE',
      ])
    })

    it('STARTER package has correct configuration', () => {
      expect(PACKAGES.STARTER.reviews).toBe(5)
      expect(PACKAGES.STARTER.minProReviews).toBe(0)
      expect(PACKAGES.STARTER.price).toBe(495)
      expect(PACKAGES.STARTER.name).toBe('Listener Pulse')
    })

    it('STANDARD package has correct configuration', () => {
      expect(PACKAGES.STANDARD.reviews).toBe(20)
      expect(PACKAGES.STANDARD.minProReviews).toBe(2)
      expect(PACKAGES.STANDARD.price).toBe(1495)
      expect(PACKAGES.STANDARD.name).toBe('Release Ready')
    })

    it('PRO package has correct configuration', () => {
      expect(PACKAGES.PRO.reviews).toBe(20)
      expect(PACKAGES.PRO.minProReviews).toBe(5)
      expect(PACKAGES.PRO.price).toBe(2995)
      expect(PACKAGES.PRO.name).toBe('Maximum Signal')
    })

    it('DEEP_DIVE package has correct configuration', () => {
      expect(PACKAGES.DEEP_DIVE.reviews).toBe(20)
      expect(PACKAGES.DEEP_DIVE.minProReviews).toBe(5)
      expect(PACKAGES.DEEP_DIVE.price).toBe(2995)
      expect(PACKAGES.DEEP_DIVE.name).toBe('Deep Dive')
    })

    it('prices are in cents', () => {
      expect(PACKAGES.STARTER.price).toBe(495) // $4.95
      expect(PACKAGES.STANDARD.price).toBe(1495) // $14.95
      expect(PACKAGES.PRO.price).toBe(2995) // $29.95
      expect(PACKAGES.DEEP_DIVE.price).toBe(2995) // $29.95
    })

    it('all packages have required fields', () => {
      Object.values(PACKAGES).forEach(pkg => {
        expect(pkg).toHaveProperty('name')
        expect(pkg).toHaveProperty('reviews')
        expect(pkg).toHaveProperty('minProReviews')
        expect(pkg).toHaveProperty('price')
        expect(pkg).toHaveProperty('description')
        expect(pkg).toHaveProperty('mix')
      })
    })
  })

  describe('Package pricing logic', () => {
    it('calculates correct price per review', () => {
      const starterPerReview = PACKAGES.STARTER.price / PACKAGES.STARTER.reviews
      const standardPerReview = PACKAGES.STANDARD.price / PACKAGES.STANDARD.reviews
      const proPerReview = PACKAGES.PRO.price / PACKAGES.PRO.reviews
      const deepDivePerReview = PACKAGES.DEEP_DIVE.price / PACKAGES.DEEP_DIVE.reviews

      expect(starterPerReview).toBeCloseTo(99.0, 1) // $0.99 per review
      expect(standardPerReview).toBeCloseTo(74.75, 2) // $0.7475 per review
      expect(proPerReview).toBeCloseTo(149.75, 2) // $1.4975 per review
      expect(deepDivePerReview).toBeCloseTo(149.75, 2) // $1.4975 per review
    })

    it('higher tiers cost more per review', () => {
      const proPerReview = PACKAGES.PRO.price / PACKAGES.PRO.reviews
      const standardPerReview = PACKAGES.STANDARD.price / PACKAGES.STANDARD.reviews
      const starterPerReview = PACKAGES.STARTER.price / PACKAGES.STARTER.reviews

      expect(proPerReview).toBeGreaterThan(standardPerReview)
    })
  })
})
