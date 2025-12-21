import { vi } from 'vitest'

export const mockSendTierChangeEmail = vi.fn()
export const mockSendPasswordResetEmail = vi.fn()
export const mockSendEmailVerificationEmail = vi.fn()
export const mockSendTrackQueuedEmail = vi.fn()
export const mockSendReviewProgressEmail = vi.fn()

vi.mock('@/lib/email', () => ({
  sendTierChangeEmail: mockSendTierChangeEmail,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
  sendEmailVerificationEmail: mockSendEmailVerificationEmail,
  sendTrackQueuedEmail: mockSendTrackQueuedEmail,
  sendReviewProgressEmail: mockSendReviewProgressEmail,
}))
