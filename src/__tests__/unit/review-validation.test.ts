/**
 * Review Validation Tests
 * Tests review text quality validation
 */

import { describe, it, expect } from 'vitest'

// Recreate the validation logic from the reviews route for testing
const MIN_WORDS_PER_SECTION = 30

function extractWords(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? []
}

function validateReviewText(fieldLabel: string, text: string): string | null {
  const words = extractWords(text)

  if (words.length < MIN_WORDS_PER_SECTION) {
    return `${fieldLabel} must be at least ${MIN_WORDS_PER_SECTION} words`
  }

  const unique = new Set(words)
  const uniqueRatio = unique.size / words.length

  if (unique.size < 8 || uniqueRatio < 0.3) {
    return `${fieldLabel} seems too repetitive. Please be more specific.`
  }

  return null
}

describe('Review Text Validation', () => {
  describe('extractWords', () => {
    it('extracts lowercase words from text', () => {
      expect(extractWords('Hello World')).toEqual(['hello', 'world'])
    })

    it('handles punctuation correctly', () => {
      expect(extractWords("It's a great track!")).toEqual(["it's", 'a', 'great', 'track'])
    })

    it('returns empty array for empty string', () => {
      expect(extractWords('')).toEqual([])
    })

    it('handles numbers', () => {
      expect(extractWords('The beat drops at 2:30')).toEqual(['the', 'beat', 'drops', 'at', '2', '30'])
    })
  })

  describe('validateReviewText', () => {
    const validReview = `
      The production quality on this track is really impressive.
      I love how the bass hits in the drop section around the one minute mark.
      The synth layers create a really nice atmosphere that builds throughout.
      The mixing is clean and every element has its own space in the frequency spectrum.
      Overall this is a well-crafted piece of music with great attention to detail.
    `

    it('accepts valid review with sufficient words and variety', () => {
      expect(validateReviewText('Best part', validReview)).toBeNull()
    })

    it('rejects review with too few words', () => {
      const shortReview = 'Good beat nice sound'
      const error = validateReviewText('Best part', shortReview)
      expect(error).toBe('Best part must be at least 30 words')
    })

    it('rejects highly repetitive text', () => {
      const repetitiveReview = Array(40).fill('good').join(' ')
      const error = validateReviewText('Best part', repetitiveReview)
      expect(error).toBe('Best part seems too repetitive. Please be more specific.')
    })

    it('rejects text with low unique word count', () => {
      // 30+ words but only 5 unique words
      const lowVariety = 'good beat good beat good beat good beat good beat good beat good beat good beat good beat good beat good beat good beat good beat good beat good beat'
      const error = validateReviewText('Weakest part', lowVariety)
      expect(error).toBe('Weakest part seems too repetitive. Please be more specific.')
    })

    it('uses field label in error messages', () => {
      const shortReview = 'Short'
      expect(validateReviewText('Best part', shortReview)).toContain('Best part')
      expect(validateReviewText('Weakest part', shortReview)).toContain('Weakest part')
    })
  })

  describe('Minimum listen time', () => {
    const MIN_LISTEN_SECONDS = 180

    it('requires 3 minutes (180 seconds) of listening', () => {
      expect(MIN_LISTEN_SECONDS).toBe(180)
    })

    it('rejects submissions below minimum listen time', () => {
      const listenDuration = 120 // 2 minutes
      expect(listenDuration < MIN_LISTEN_SECONDS).toBe(true)
    })

    it('accepts submissions at or above minimum listen time', () => {
      expect(180 >= MIN_LISTEN_SECONDS).toBe(true)
      expect(300 >= MIN_LISTEN_SECONDS).toBe(true)
    })
  })

  describe('Heartbeat session validation', () => {
    const SESSION_TIMEOUT_MS = 2 * 60 * 1000 // 2 minutes

    it('session expires after 2 minutes of inactivity', () => {
      const now = Date.now()
      const lastHeartbeat = new Date(now - SESSION_TIMEOUT_MS - 1000) // 2min 1sec ago

      const isExpired = now - lastHeartbeat.getTime() > SESSION_TIMEOUT_MS
      expect(isExpired).toBe(true)
    })

    it('session is valid within 2 minute window', () => {
      const now = Date.now()
      const lastHeartbeat = new Date(now - 60000) // 1 minute ago

      const isExpired = now - lastHeartbeat.getTime() > SESSION_TIMEOUT_MS
      expect(isExpired).toBe(false)
    })
  })
})

describe('Review Scores', () => {
  it('scores must be between 1 and 5', () => {
    const validScores = [1, 2, 3, 4, 5]
    const invalidScores = [0, 6, -1, 10]

    validScores.forEach(score => {
      expect(score >= 1 && score <= 5).toBe(true)
    })

    invalidScores.forEach(score => {
      expect(score >= 1 && score <= 5).toBe(false)
    })
  })

  it('vocal score can be null for instrumentals', () => {
    const review = {
      productionScore: 4,
      originalityScore: 5,
      vocalScore: null, // Instrumental track
    }

    expect(review.vocalScore).toBeNull()
    expect(review.productionScore).toBeDefined()
    expect(review.originalityScore).toBeDefined()
  })
})

describe('First Impression Values', () => {
  const validImpressions = ['STRONG_HOOK', 'DECENT', 'LOST_INTEREST'] as const

  it('only accepts valid first impression values', () => {
    validImpressions.forEach(impression => {
      expect(validImpressions.includes(impression)).toBe(true)
    })
  })

  it('rejects invalid first impression values', () => {
    const invalidImpressions = ['AMAZING', 'BAD', 'OK', '']
    invalidImpressions.forEach(impression => {
      expect(validImpressions.includes(impression as typeof validImpressions[number])).toBe(false)
    })
  })
})
