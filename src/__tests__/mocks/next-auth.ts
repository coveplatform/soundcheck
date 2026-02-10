import { vi } from 'vitest'

export const mockSession = {
  User: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    isArtist: true,
    isReviewer: false,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockGetServerSession = vi.fn()

vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}))

// Helper to set up authenticated session
export function mockAuthenticatedSession(overrides = {}) {
  mockGetServerSession.mockResolvedValue({
    ...mockSession,
    User: { ...mockSession.user, ...overrides },
  })
}

// Helper to set up unauthenticated session
export function mockUnauthenticatedSession() {
  mockGetServerSession.mockResolvedValue(null)
}
