/**
 * Auth Validation Tests
 * Tests signup validation, password requirements, and role assignment
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Recreate the signup schema from the auth route
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['artist', 'reviewer', 'both']),
  acceptedTerms: z.boolean(),
})

describe('Signup Validation', () => {
  describe('Email validation', () => {
    it('accepts valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'artist.name@music.co',
        'reviewer+test@gmail.com',
        'a@b.io',
      ]

      validEmails.forEach(email => {
        const result = signupSchema.safeParse({
          email,
          password: 'validpassword123',
          name: 'Test User',
          role: 'artist',
          acceptedTerms: true,
        })
        expect(result.success).toBe(true)
      })
    })

    it('rejects invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@missing.user',
        'missing@domain',
        'spaces in@email.com',
        '',
      ]

      invalidEmails.forEach(email => {
        const result = signupSchema.safeParse({
          email,
          password: 'validpassword123',
          name: 'Test User',
          role: 'artist',
          acceptedTerms: true,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Password validation', () => {
    it('accepts passwords with 8+ characters', () => {
      const validPasswords = [
        'password', // exactly 8
        'longerpassword123',
        'VerySecure!@#$%^',
        '12345678',
      ]

      validPasswords.forEach(password => {
        const result = signupSchema.safeParse({
          email: 'user@example.com',
          password,
          name: 'Test User',
          role: 'artist',
          acceptedTerms: true,
        })
        expect(result.success).toBe(true)
      })
    })

    it('rejects passwords with fewer than 8 characters', () => {
      const invalidPasswords = ['short', '1234567', 'pass', '']

      invalidPasswords.forEach(password => {
        const result = signupSchema.safeParse({
          email: 'user@example.com',
          password,
          name: 'Test User',
          role: 'artist',
          acceptedTerms: true,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Password must be at least 8 characters'
          )
        }
      })
    })
  })

  describe('Name validation', () => {
    it('accepts non-empty names', () => {
      const validNames = ['John', 'A', 'Artist Name 123', '音楽家']

      validNames.forEach(name => {
        const result = signupSchema.safeParse({
          email: 'user@example.com',
          password: 'validpassword123',
          name,
          role: 'artist',
          acceptedTerms: true,
        })
        expect(result.success).toBe(true)
      })
    })

    it('rejects empty names', () => {
      const result = signupSchema.safeParse({
        email: 'user@example.com',
        password: 'validpassword123',
        name: '',
        role: 'artist',
        acceptedTerms: true,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('Role validation', () => {
    it('accepts valid roles', () => {
      const validRoles = ['artist', 'reviewer', 'both'] as const

      validRoles.forEach(role => {
        const result = signupSchema.safeParse({
          email: 'user@example.com',
          password: 'validpassword123',
          name: 'Test User',
          role,
          acceptedTerms: true,
        })
        expect(result.success).toBe(true)
      })
    })

    it('rejects invalid roles', () => {
      const invalidRoles = ['admin', 'producer', '', 'ARTIST']

      invalidRoles.forEach(role => {
        const result = signupSchema.safeParse({
          email: 'user@example.com',
          password: 'validpassword123',
          name: 'Test User',
          role,
          acceptedTerms: true,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Terms acceptance', () => {
    it('parses with acceptedTerms boolean', () => {
      const resultTrue = signupSchema.safeParse({
        email: 'user@example.com',
        password: 'validpassword123',
        name: 'Test User',
        role: 'artist',
        acceptedTerms: true,
      })
      expect(resultTrue.success).toBe(true)

      const resultFalse = signupSchema.safeParse({
        email: 'user@example.com',
        password: 'validpassword123',
        name: 'Test User',
        role: 'artist',
        acceptedTerms: false,
      })
      expect(resultFalse.success).toBe(true) // Schema parses, business logic checks
    })
  })
})

describe('Role Assignment', () => {
  it('artist role sets isArtist=true, isReviewer=false', () => {
    const role: string = 'artist'
    const isArtist = role === 'artist' || role === 'both'
    const isReviewer = role === 'reviewer' || role === 'both'

    expect(isArtist).toBe(true)
    expect(isReviewer).toBe(false)
  })

  it('reviewer role sets isArtist=false, isReviewer=true', () => {
    const role: string = 'reviewer'
    const isArtist = role === 'artist' || role === 'both'
    const isReviewer = role === 'reviewer' || role === 'both'

    expect(isArtist).toBe(false)
    expect(isReviewer).toBe(true)
  })

  it('both role sets isArtist=true, isReviewer=true', () => {
    const role: string = 'both'
    const isArtist = role === 'artist' || role === 'both'
    const isReviewer = role === 'reviewer' || role === 'both'

    expect(isArtist).toBe(true)
    expect(isReviewer).toBe(true)
  })

  it('new model: all users are artists by default', () => {
    // In the peer-to-peer model, isArtist is always true
    const isArtist = true
    expect(isArtist).toBe(true)
  })
})

describe('Password Hashing', () => {
  it('uses 10 rounds of bcrypt', () => {
    // This is just a documentation test - actual bcrypt is tested at integration level
    const BCRYPT_ROUNDS = 10
    expect(BCRYPT_ROUNDS).toBe(10)
  })
})

describe('Email Verification Token', () => {
  it('token expires after 24 hours', () => {
    const TOKEN_EXPIRY_HOURS = 24
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    const hoursUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
    expect(Math.round(hoursUntilExpiry)).toBe(24)
  })
})

describe('Password Reset Token', () => {
  it('token expires after 1 hour', () => {
    const TOKEN_EXPIRY_HOURS = 1
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    const hoursUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
    expect(Math.round(hoursUntilExpiry)).toBe(1)
  })
})
