import { describe, expect, it } from "vitest"

import { prepareYoyChartData } from "@/features/taxes/tax-yoy-chart"
import type { TaxYoyItem } from "@/features/taxes/taxes.queries"

describe("prepareYoyChartData", () => {
  const mockYoyItems: TaxYoyItem[] = [
    {
      year: 2024,
      totalTrips: 120,
      totalTonnage: 3600,
      grossOmset: 600000000,
      netOmset12Pct: 525000000,
      totalExpenses: 400000000,
      realOperatingProfit: 125000000,
      tax1PctWithholding: 6000000,
      bestSchemeTax: 3000000,
      bestSchemeName: "PPh Final UMKM 0.5% (PP 55/2022)",
    },
    {
      year: 2025,
      totalTrips: 150,
      totalTonnage: 4500,
      grossOmset: 750000000,
      netOmset12Pct: 656250000,
      totalExpenses: 500000000,
      realOperatingProfit: 156250000,
      tax1PctWithholding: 7500000,
      bestSchemeTax: 3750000,
      bestSchemeName: "PPh Final UMKM 0.5% (PP 55/2022)",
    },
    {
      year: 2026,
      totalTrips: 180,
      totalTonnage: 5400,
      grossOmset: 900000000,
      netOmset12Pct: 787500000,
      totalExpenses: 600000000,
      realOperatingProfit: 187500000,
      tax1PctWithholding: 9000000,
      bestSchemeTax: 4500000,
      bestSchemeName: "PPh Final UMKM 0.5% (PP 55/2022)",
    },
  ]

  it("transforms TaxYoyItem array into recharts-ready points with formatted labels", () => {
    const points = prepareYoyChartData(mockYoyItems)

    expect(points).toHaveLength(3)
    expect(points[0].yearLabel).toBe("2024")
    expect(points[0].grossOmset).toBe(600000000)
    expect(points[0].totalExpenses).toBe(400000000)
    expect(points[0].realOperatingProfit).toBe(125000000)
    expect(points[0].bestSchemeTax).toBe(3000000)
    expect(points[0].bestSchemeName).toContain("UMKM 0.5%")
  })

  it("handles empty array safely", () => {
    const points = prepareYoyChartData([])
    expect(points).toEqual([])
  })
})
