import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the db module
vi.mock("@/db", () => {
  const dummyRows = [
    { totalTrips: 5, totalOmset: 10000000, totalProfit: 5000000 },
  ]
  const mockOrderBy = vi.fn().mockResolvedValue(dummyRows)
  const mockWhere = vi.fn().mockImplementation(() => ({
    orderBy: mockOrderBy,
    then: (resolve: (v: typeof dummyRows) => void) => resolve(dummyRows),
  }))
  const mockFrom = vi.fn().mockReturnValue({
    where: mockWhere,
    orderBy: mockOrderBy,
    then: (resolve: (v: typeof dummyRows) => void) => resolve(dummyRows),
  })
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

  return {
    db: {
      select: mockSelect,
    },
  }
})

describe("trips.queries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("listTrips should return an array", async () => {
    const { listTrips } = await import("@/features/trips/trips.queries")
    const result = await listTrips({})
    expect(Array.isArray(result)).toBe(true)
  })

  it("getRateReferences should return active rates", async () => {
    const { getRateReferences } = await import("@/features/trips/trips.queries")
    const result = await getRateReferences()
    expect(Array.isArray(result)).toBe(true)
  })

  it("getTripsSummary should return summary numbers", async () => {
    const { getTripsSummary } = await import("@/features/trips/trips.queries")
    const result = await getTripsSummary({})
    expect(result).toHaveProperty("totalTrips")
    expect(result).toHaveProperty("totalOmset")
    expect(result).toHaveProperty("totalProfit")
  })
})
