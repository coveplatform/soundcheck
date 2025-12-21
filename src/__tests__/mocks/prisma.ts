import { vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended'

// Create a deep mock of PrismaClient
export const prismaMock = mockDeep<PrismaClient>()

// Reset all mocks before each test
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

// Helper to reset prisma mock
export function resetPrismaMock() {
  mockReset(prismaMock)
}

export type MockPrismaClient = DeepMockProxy<PrismaClient>
