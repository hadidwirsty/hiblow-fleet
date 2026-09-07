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

  const mockOrderBy = vi.fn().mockResolvedValue(dummyExpenses)
  const mockWhere = vi.fn().mockImplementation(() => ({
    orderBy: mockOrderBy,
    then: (resolve: (v: typeof dummySummary) => void) => resolve(dummySummary),
  }))
  const mockFrom = vi.fn().mockReturnValue({
    where: mockWhere,
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
})
