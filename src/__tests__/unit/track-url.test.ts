/**
 * Track URL gating — private SoundCloud share links must be barred so they
 * never reach the reviewer-side embed (which can't play them).
 */

import { describe, it, expect } from 'vitest'
import {
  isPrivateSoundcloudUrl,
  isSupportedTrackUrl,
  unsupportedReason,
} from '@/lib/track-url'

describe('isPrivateSoundcloudUrl', () => {
  it('flags /s-<token> private share links', () => {
    const privateUrls = [
      'https://soundcloud.com/riku-korkiam-ki/cello-octet/s-snyJCaBgYLr?si=89c79b311f45528f5545cfda18300e&utm_source=clipboard',
      'soundcloud.com/artist/track/s-AbCd1234',
      'https://soundcloud.com/artist/sets/my-playlist/s-XyZ987', // private playlist
      'https://soundcloud.com/artist/track?secret_token=s-abc123',
    ]
    privateUrls.forEach(url => {
      expect(isPrivateSoundcloudUrl(url)).toBe(true)
    })
  })

  it('does not flag public SoundCloud links', () => {
    const publicUrls = [
      'https://soundcloud.com/artist/track',
      'https://soundcloud.com/artist/track-name',
      'https://soundcloud.com/artist/sets/my-playlist',
      'https://www.soundcloud.com/s-low/some-track', // user slug starting with s-
      'https://soundcloud.com/s-low/track', // 2-segment, slug-like
    ]
    publicUrls.forEach(url => {
      expect(isPrivateSoundcloudUrl(url)).toBe(false)
    })
  })

  it('ignores non-SoundCloud hosts', () => {
    expect(isPrivateSoundcloudUrl('https://example.com/a/b/s-token')).toBe(false)
    expect(isPrivateSoundcloudUrl('not a url')).toBe(false)
  })
})

describe('isSupportedTrackUrl rejects private SoundCloud links', () => {
  it('rejects a private share link', () => {
    expect(
      isSupportedTrackUrl('https://soundcloud.com/artist/track/s-snyJCaBgYLr')
    ).toBe(false)
  })

  it('still accepts the public version', () => {
    expect(isSupportedTrackUrl('https://soundcloud.com/artist/track')).toBe(true)
  })
})

describe('unsupportedReason explains private links', () => {
  it('returns the private-link reason', () => {
    const reason = unsupportedReason('https://soundcloud.com/artist/track/s-snyJCaBgYLr')
    expect(reason).toMatch(/private soundcloud link/i)
  })

  it('returns null for a clean public link', () => {
    expect(unsupportedReason('https://soundcloud.com/artist/track')).toBeNull()
  })
})
