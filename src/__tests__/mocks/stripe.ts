import { vi } from 'vitest'

export const mockStripe = {
  checkout: {
    sessions: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
  },
  refunds: {
    create: vi.fn(),
  },
  transfers: {
    create: vi.fn(),
  },
  accounts: {
    create: vi.fn(),
    retrieve: vi.fn(),
  },
  accountLinks: {
    create: vi.fn(),
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
}

vi.mock('@/lib/stripe', () => ({
  stripe: mockStripe,
}))
