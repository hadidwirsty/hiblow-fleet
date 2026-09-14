import { describe, expect, it } from "vitest"

import { prepareRouteChartData } from "@/domain/route-trend"

const sampleItems = [
  {
    destinationCity: "TUBAN",
    tripCount: 15,
    totalOmset: 75_000_000,
    totalProfit: 30_000_000,
    avgOmset: 5_000_000,
  },
  {
    destinationCity: "GROBOGAN",
    tripCount: 10,
    totalOmset: 50_000_000,
    totalProfit: 20_000_000,
    avgOmset: 5_000_000,
  },
]

describe("prepareRouteChartData", () => {
  it("returns empty array for empty input", () => {
    expect(prepareRouteChartData([])).toEqual([])
  })

  it("adds label field to each item", () => {
    const result = prepareRouteChartData(sampleItems)
    expect(result[0]).toHaveProperty("label")
    expect(typeof result[0].label).toBe("string")
  })

  it("adds omsetJuta as totalOmset / 1_000_000 rounded 1 decimal", () => {
    const result = prepareRouteChartData(sampleItems)
    expect(result[0].omsetJuta).toBe(75.0)
  })

  it("adds profitJuta as totalProfit / 1_000_000 rounded 1 decimal", () => {
    const result = prepareRouteChartData(sampleItems)
    expect(result[0].profitJuta).toBe(30.0)
  })

  it("truncates label longer than 12 chars with ellipsis", () => {
    const longNameItems = [
      {
        destinationCity: "INDOCEMENT GROBOGAN SANGAT PANJANG",
        tripCount: 5,
        totalOmset: 25_000_000,
        totalProfit: 10_000_000,
        avgOmset: 5_000_000,
      },
    ]
    const result = prepareRouteChartData(longNameItems)
    expect(result[0].label.length).toBeLessThanOrEqual(13) // 12 + "…"
    expect(result[0].label.endsWith("…")).toBe(true)
  })

  it("preserves input order", () => {
    const result = prepareRouteChartData(sampleItems)
    expect(result[0].destinationCity).toBe("TUBAN")
    expect(result[1].destinationCity).toBe("GROBOGAN")
  })
})
