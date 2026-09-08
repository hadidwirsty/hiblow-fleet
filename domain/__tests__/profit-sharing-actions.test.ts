import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const mockPeriodReturning = vi.fn().mockResolvedValue([
  {
    id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    title: "Bagi Hasil September 2025",
    startDate: "2025-09-01",
    endDate: "2025-09-30",
    totalIncome: "80000000.00",
    totalExpenses: "30000000.00",
    grossBalance: "50000000.00",
    managerCommissionRate: "0.0500",
    managerCommissionAmount: "2500000.00",
    distributableProfit: "47500000.00",
    fleetValuation: "580000000.00",
    managerProfit: "36935345.00",
    managerTakeHome: "39435345.00",
    status: "draft",
  },
])

const mockTx = {
  insert: vi.fn().mockImplementation(() => ({
    values: vi.fn().mockImplementation(() => ({
      returning: mockPeriodReturning,
    })),
  })),
}

const mockWhere = vi.fn().mockResolvedValue([])

vi.mock("@/db", () => ({
  db: {
    transaction: vi.fn().mockImplementation(async (cb) => cb(mockTx)),
    delete: vi.fn().mockImplementation(() => ({
      where: mockWhere,
    })),
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation(() => ({
        where: mockWhere,
      })),
    })),
  },
}))

vi.mock("@/features/profit-sharing/profit-sharing.queries", () => ({
  getIncomeForPeriod: vi.fn().mockResolvedValue(80000000),
  getExpensesForPeriod: vi.fn().mockResolvedValue(30000000),
}))

vi.mock("@/lib/session", () => ({
  getCurrentSession: vi.fn().mockResolvedValue(null),
}))

vi.mock("@/lib/rbac", () => ({
  assertAdmin: vi.fn(),
}))

describe("profit-sharing.actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("previewPeriodCalculation returns calculated breakdown accurately", async () => {
    const { previewPeriodCalculation } =
      await import("@/features/profit-sharing/profit-sharing.actions")

    const result = await previewPeriodCalculation({
      startDate: "2025-09-01",
      endDate: "2025-09-30",
      managerCommissionRate: 0.05,
      fleetValuation: 580000000,
      partners: [
        { name: "Alfiah", capitalShare: 50000000 },
        { name: "Mas Dhian", capitalShare: 75000000 },
        { name: "Hadid", capitalShare: 4000000 },
      ],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.totalIncome).toBe(80000000)
      expect(result.totalExpenses).toBe(30000000)
      expect(result.calculation.grossBalance).toBe(50000000)
      expect(result.calculation.distributableProfit).toBe(47500000)
      expect(result.calculation.partnerShares).toHaveLength(3)
    }
  })

  it("previewPeriodCalculation fails with invalid date range", async () => {
    const { previewPeriodCalculation } =
      await import("@/features/profit-sharing/profit-sharing.actions")

    const result = await previewPeriodCalculation({
      startDate: "2025-09-30",
      endDate: "2025-09-01",
      managerCommissionRate: 0.05,
      fleetValuation: 580000000,
      partners: [],
    })

    expect(result.success).toBe(false)
  })

  it("createProfitSharingPeriod succeeds and saves calculation", async () => {
    const { createProfitSharingPeriod } =
      await import("@/features/profit-sharing/profit-sharing.actions")

    const result = await createProfitSharingPeriod({
      title: "Bagi Hasil September 2025",
      startDate: "2025-09-01",
      endDate: "2025-09-30",
      managerCommissionRate: 0.05,
      fleetValuation: 580000000,
      partners: [
        { name: "Alfiah", capitalShare: 50000000 },
        { name: "Mas Dhian", capitalShare: 75000000 },
        { name: "Hadid", capitalShare: 4000000 },
      ],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.period.id).toBe("b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22")
    }
  })

  it("deleteProfitSharingPeriod succeeds with valid ID", async () => {
    const { deleteProfitSharingPeriod } =
      await import("@/features/profit-sharing/profit-sharing.actions")

    const result = await deleteProfitSharingPeriod(
      "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"
    )
    expect(result.success).toBe(true)
  })

  it("updateProfitSharingStatus updates status to finalized", async () => {
    const { updateProfitSharingStatus } =
      await import("@/features/profit-sharing/profit-sharing.actions")

    const result = await updateProfitSharingStatus(
      "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      "finalized"
    )
    expect(result.success).toBe(true)
  })
})
