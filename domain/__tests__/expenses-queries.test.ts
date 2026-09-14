import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the db module
vi.mock("@/db", () => {
  const dummyExpenses = [
    {
      id: "exp-1",
      truckId: "W8187UA",
      expenseDate: "2026-09-01",
      category: "Servis",
      description: "Ganti oli",
      amount: "500000.00",
      adminFee: "2500.00",
      location: "Tuban",
    },
  ]
  const dummySummary = [
    {
      totalCount: 1,
      totalExpenses: 502500,
      totalAmount: 500000,
      totalAdminFee: 2500,
    },
  ]

  const dummyBreakdown = [
    {
      category: "Servis",
      total: 502500,
      count: 1,
    },
  ]

  const mockOrderBy = vi
    .fn()
    .mockImplementation(() => Promise.resolve(dummyBreakdown))
  const mockGroupBy = vi.fn().mockReturnValue({
    orderBy: mockOrderBy,
    then: (resolve: (v: typeof dummyBreakdown) => void) =>
      resolve(dummyBreakdown),
  })
  const mockWhere = vi.fn().mockImplementation(() => ({
    groupBy: mockGroupBy,
    orderBy: mockOrderBy,
    then: (resolve: (v: typeof dummySummary) => void) => resolve(dummySummary),
  }))
  const mockFrom = vi.fn().mockReturnValue({
    where: mockWhere,
    groupBy: mockGroupBy,
    orderBy: mockOrderBy,
    then: (resolve: (v: typeof dummyExpenses) => void) =>
      resolve(dummyExpenses),
  })
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

  return {
    db: {
      select: mockSelect,
    },
  }
})

describe("expenses.queries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("listExpenses should return an array", async () => {
    const { listExpenses } =
      await import("@/features/expenses/expenses.queries")
    const result = await listExpenses({})
    expect(Array.isArray(result)).toBe(true)
  })

  it("getExpensesSummary should return summary figures", async () => {
    const { getExpensesSummary } =
      await import("@/features/expenses/expenses.queries")
    const result = await getExpensesSummary({})
    expect(result).toHaveProperty("totalCount")
    expect(result).toHaveProperty("totalExpenses")
    expect(result).toHaveProperty("totalAmount")
    expect(result).toHaveProperty("totalAdminFee")
  })

  it("getExpensesCategoryBreakdown should return array", async () => {
    const { getExpensesCategoryBreakdown } =
      await import("@/features/expenses/expenses.queries")
    const result = await getExpensesCategoryBreakdown({})
    expect(Array.isArray(result)).toBe(true)
  })

  it("getExpensesCategoryBreakdown should accept truckId filter", async () => {
    const { getExpensesCategoryBreakdown } =
      await import("@/features/expenses/expenses.queries")
    const result = await getExpensesCategoryBreakdown({ truckId: "W8187UA" })
    expect(Array.isArray(result)).toBe(true)
  })

  it("getExpensesCategoryBreakdown items should have category, total, count", async () => {
    const { getExpensesCategoryBreakdown } =
      await import("@/features/expenses/expenses.queries")
    const result = await getExpensesCategoryBreakdown({})
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("category")
      expect(result[0]).toHaveProperty("total")
      expect(result[0]).toHaveProperty("count")
    }
  })
})
