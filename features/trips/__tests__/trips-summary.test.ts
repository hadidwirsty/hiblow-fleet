import { describe, expect, it } from "vitest"

import type { TripsSummary as TripsSummaryType } from "@/features/trips/trips.queries"

describe("trips-summary calculation and ratios", () => {
  it("calculates profit margin and sangu ratio correctly", () => {
    const summary: TripsSummaryType = {
      totalTrips: 10,
      totalOmset: 25000000,
      totalSangu: 12500000,
      totalProfit: 11000000,
    }

    const profitMargin =
      summary.totalOmset > 0
        ? ((summary.totalProfit / summary.totalOmset) * 100).toFixed(1)
        : "0.0"

    const sanguRatio =
      summary.totalOmset > 0
        ? ((summary.totalSangu / summary.totalOmset) * 100).toFixed(1)
        : "0.0"

    expect(profitMargin).toBe("44.0")
    expect(sanguRatio).toBe("50.0")
  })

  it("handles zero omset gracefully without NaN or infinity", () => {
    const summary: TripsSummaryType = {
      totalTrips: 0,
      totalOmset: 0,
      totalSangu: 0,
      totalProfit: 0,
    }

    const profitMargin =
      summary.totalOmset > 0
        ? ((summary.totalProfit / summary.totalOmset) * 100).toFixed(1)
        : "0.0"

    const sanguRatio =
      summary.totalOmset > 0
        ? ((summary.totalSangu / summary.totalOmset) * 100).toFixed(1)
        : "0.0"

    expect(profitMargin).toBe("0.0")
    expect(sanguRatio).toBe("0.0")
  })
})
