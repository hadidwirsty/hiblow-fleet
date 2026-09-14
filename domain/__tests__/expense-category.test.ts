import { describe, expect, it } from "vitest"

import { prepareCategoryChartData } from "@/domain/expense-category"

describe("prepareCategoryChartData", () => {
  it("returns empty array for empty input", () => {
    expect(prepareCategoryChartData([], 0)).toEqual([])
  })

  it("returns 100% for single item", () => {
    const result = prepareCategoryChartData(
      [{ category: "Servis", total: 500000, count: 1 }],
      500000
    )
    expect(result[0].percentage).toBe(100.0)
  })

  it("percentages sum to ~100 for multiple items", () => {
    const items = [
      { category: "Servis", total: 600000, count: 2 },
      { category: "BBM", total: 400000, count: 1 },
    ]
    const result = prepareCategoryChartData(items, 1000000)
    const sum = result.reduce((acc, item) => acc + item.percentage, 0)
    expect(sum).toBeCloseTo(100, 0)
  })

  it("returns percentage 0 when totalExpenses is 0", () => {
    const result = prepareCategoryChartData(
      [{ category: "Servis", total: 0, count: 0 }],
      0
    )
    expect(result[0].percentage).toBe(0)
  })

  it("each item has a non-empty fill string property", () => {
    const result = prepareCategoryChartData(
      [{ category: "Servis", total: 500000, count: 1 }],
      500000
    )
    expect(typeof result[0].fill).toBe("string")
    expect(result[0].fill.length).toBeGreaterThan(0)
  })
})
