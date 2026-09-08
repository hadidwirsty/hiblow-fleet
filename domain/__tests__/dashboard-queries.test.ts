import { beforeEach, describe, expect, it, vi } from "vitest"

const mockFromWhere = vi.fn()
const mockFromGroupBy = vi.fn()
const mockFromLimit = vi.fn()
const mockFromOrderBy = vi.fn(() => ({ limit: mockFromLimit }))

const mockFrom = vi.fn(() => ({
  where: mockFromWhere,
  orderBy: mockFromOrderBy,
  groupBy: mockFromGroupBy,
}))

const mockSelect = vi.fn(() => ({ from: mockFrom }))
const mockExecute = vi.fn()

vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
    execute: mockExecute,
  },
}))

describe("getDashboardKPIs", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("harus menghitung estimasiLaba = totalOmset - totalSangu - totalExpenses", async () => {
    mockFromWhere
      .mockResolvedValueOnce([
        { totalOmset: 100_000_000, totalTrips: 30, totalSangu: 40_000_000 },
      ])
      .mockResolvedValueOnce([{ totalExpenses: 20_000_000 }])
      .mockResolvedValueOnce([{ totalOmset: 90_000_000, totalTrips: 28 }])

    const { getDashboardKPIs } =
      await import("@/features/dashboard/dashboard.queries")
    const result = await getDashboardKPIs(9, 2026)

    expect(result.totalOmset).toBe(100_000_000)
    expect(result.totalTrips).toBe(30)
    expect(result.totalSangu).toBe(40_000_000)
    expect(result.totalExpenses).toBe(20_000_000)
    expect(result.estimasiLaba).toBe(40_000_000)
    expect(result.previousOmset).toBe(90_000_000)
    expect(result.previousTrips).toBe(28)
  })

  it("harus menangani nilai kosong/null dengan fallback 0", async () => {
    mockFromWhere
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const { getDashboardKPIs } =
      await import("@/features/dashboard/dashboard.queries")
    const result = await getDashboardKPIs(1, 2026)

    expect(result.totalOmset).toBe(0)
    expect(result.totalTrips).toBe(0)
    expect(result.totalSangu).toBe(0)
    expect(result.totalExpenses).toBe(0)
    expect(result.estimasiLaba).toBe(0)
    expect(result.previousOmset).toBe(0)
    expect(result.previousTrips).toBe(0)
  })
})

describe("getTruckBreakdown", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("harus mengembalikan breakdown ritase per truk", async () => {
    const mockBreakdown = [
      {
        truckId: "W8187UA",
        totalTrips: 15,
        totalOmset: 50_000_000,
        totalSangu: 20_000_000,
      },
      {
        truckId: "H8133OF",
        totalTrips: 12,
        totalOmset: 40_000_000,
        totalSangu: 16_000_000,
      },
    ]
    mockFromWhere.mockReturnValueOnce({
      groupBy: vi.fn().mockResolvedValue(mockBreakdown),
    })

    const { getTruckBreakdown } =
      await import("@/features/dashboard/dashboard.queries")
    const result = await getTruckBreakdown(9, 2026)

    expect(result).toHaveLength(2)
    expect(result[0].truckId).toBe("W8187UA")
    expect(result[1].truckId).toBe("H8133OF")
  })
})

describe("getDailyTripChart", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("harus mengembalikan deret harian dan mengisi hari tanpa trip dengan 0", async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [
        { date: "2026-09-01", w8187ua: 2, h8133of: 1 },
        { date: "2026-09-02", w8187ua: 0, h8133of: 0 },
      ],
    })

    const { getDailyTripChart } =
      await import("@/features/dashboard/dashboard.queries")
    const result = await getDailyTripChart(9, 2026)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ date: "2026-09-01", w8187ua: 2, h8133of: 1 })
    expect(result[1]).toEqual({ date: "2026-09-02", w8187ua: 0, h8133of: 0 })
  })
})

describe("getRecentTrips", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("harus mengambil recent trips sesuai limit yang diminta", async () => {
    const mockTrips = [
      {
        id: "trip-1",
        truckId: "W8187UA",
        orderNumber: 101,
        orderDate: "2026-09-05",
        unloadingDate: "2026-09-06",
        destinationCity: "Gresik",
        destinationName: "PT Semen Indonesia",
        unloadedTonnage: "28.50",
        omset: "3500000.00",
        sangu: "1500000.00",
      },
    ]
    mockFromLimit.mockResolvedValueOnce(mockTrips)

    const { getRecentTrips } =
      await import("@/features/dashboard/dashboard.queries")
    const result = await getRecentTrips(5)

    expect(result).toEqual(mockTrips)
    expect(mockFromLimit).toHaveBeenCalledWith(5)
  })
})
