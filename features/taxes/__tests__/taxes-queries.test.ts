import { describe, expect, it, vi } from "vitest"

import { getTaxAccountingData } from "@/features/taxes/taxes.queries"

// Mock Drizzle db module
vi.mock("@/db", () => {
  return {
    db: {
      select: vi.fn(),
    },
  }
})

describe("getTaxAccountingData", () => {
  it("aggregates trip metrics and truck opex correctly, excluding DP/Cicilan", async () => {
    const { db } = await import("@/db")

    // Mock trips query result
    const mockTripsResult = [
      {
        totalTrips: 12,
        totalTonnage: 360.5,
        grossOmset: 100000000,
        totalSangu: 40000000,
        totalIncentive: 3500000,
        totalThirdPartyFee: 1500000,
        totalDeduction2PctLju: 1000000,
        totalTax1Pct: 1000000,
      },
    ]

    // Mock expenses summary result (excluding DP/Cicilan)
    const mockExpensesSummary = [
      {
        totalOpex: 15500000,
      },
    ]

    // Mock expenses category breakdown
    const mockExpenseBreakdown = [
      { category: "Servis & Perbaikan", total: 10000000, count: 2 },
      { category: "Onderdil / Ban", total: 4000000, count: 1 },
      { category: "Administrasi & Tol", total: 1500000, count: 1 },
    ]

    const mockWithholdingTrips = [
      {
        id: "trip-1",
        orderNumber: "SJ-001",
        unloadingDate: "2026-10-05",
        destinationCity: "Tuban",
        destinationName: "SI Tuban",
        omset: "10000000",
        tax1Pct: "100000",
        taxWithholdingNumber: "BP-SI-2026-001",
        taxWithholdingDate: "2026-10-06",
      },
    ]

    let callCount = 0
    vi.mocked(db.select).mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          from: () => ({
            where: () => Promise.resolve(mockTripsResult),
          }),
        } as unknown as ReturnType<typeof db.select>
      } else if (callCount === 2) {
        return {
          from: () => ({
            where: () => Promise.resolve(mockExpensesSummary),
          }),
        } as unknown as ReturnType<typeof db.select>
      } else if (callCount === 3) {
        return {
          from: () => ({
            where: () => ({
              groupBy: () => ({
                orderBy: () => Promise.resolve(mockExpenseBreakdown),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>
      } else {
        return {
          from: () => ({
            where: () => ({
              orderBy: () => Promise.resolve(mockWithholdingTrips),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>
      }
    })

    const data = await getTaxAccountingData({
      year: 2026,
      month: 10,
    })

    expect(data.period.year).toBe(2026)
    expect(data.period.month).toBe(10)
    expect(data.tripMetrics.totalTrips).toBe(12)
    expect(data.tripMetrics.grossOmset).toBe(100000000)
    expect(data.expenseMetrics.totalOpex).toBe(15500000)
    expect(data.expenseMetrics.categoryBreakdown).toHaveLength(3)

    // Verify calculations integration
    expect(data.calculations.bookkeeping.grossOmset).toBe(100000000)
    expect(data.calculations.bookkeeping.realOperatingProfit).toBe(25000000)
    expect(data.calculations.recommendation.bestSchemeId).toBe("umkm_0_5")

    // Verify withholdingTripDetails
    expect(data.withholdingTripDetails).toHaveLength(1)
    expect(data.withholdingTripDetails[0].letterNumber).toBe("SJ-001")
    expect(data.withholdingTripDetails[0].taxWithholdingNumber).toBe(
      "BP-SI-2026-001"
    )
  })
})

describe("getTaxYoyData", () => {
  it("aggregates data for multiple years using unified annual SQL aggregation", async () => {
    const { getTaxYoyData } = await import("@/features/taxes/taxes.queries")
    const { db } = await import("@/db")

    const mockTripYearRows = [
      {
        year: 2024,
        totalTrips: 10,
        totalTonnage: 300,
        grossOmset: 80000000,
        totalSangu: 30000000,
        totalIncentive: 2000000,
        totalThirdPartyFee: 1000000,
        totalDeduction2PctLju: 800000,
        totalTax1Pct: 800000,
      },
      {
        year: 2025,
        totalTrips: 15,
        totalTonnage: 450,
        grossOmset: 120000000,
        totalSangu: 45000000,
        totalIncentive: 3000000,
        totalThirdPartyFee: 1500000,
        totalDeduction2PctLju: 1200000,
        totalTax1Pct: 1200000,
      },
    ]

    const mockExpenseYearRows = [
      { year: 2024, totalOpex: 10000000 },
      { year: 2025, totalOpex: 15000000 },
    ]

    let selectCall = 0
    vi.mocked(db.select).mockImplementation(() => {
      selectCall++
      const currentCall = selectCall
      return {
        from: () => ({
          where: () => ({
            groupBy: () =>
              Promise.resolve(
                currentCall === 1 ? mockTripYearRows : mockExpenseYearRows
              ),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>
    })

    const yoyData = await getTaxYoyData([2024, 2025, 2026])
    expect(yoyData).toBeDefined()
    expect(Array.isArray(yoyData)).toBe(true)
    expect(yoyData).toHaveLength(3)
    expect(yoyData[0].year).toBe(2024)
    expect(yoyData[0].totalTrips).toBe(10)
    expect(yoyData[0].grossOmset).toBe(80000000)
    expect(yoyData[1].year).toBe(2025)
    expect(yoyData[1].totalTrips).toBe(15)
    expect(yoyData[2].year).toBe(2026)
    expect(yoyData[2].totalTrips).toBe(0) // Default 0 jika tahun belum ada transaksi
  })
})
