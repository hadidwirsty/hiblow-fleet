import { describe, expect, it } from "vitest"

import { calculateSangu } from "@/src/domain/calculators/sangu"

describe("calculateSangu", () => {
  it("calculates sangu within standard tonnage (< 31 tons)", () => {
    // 28.5 tons @ rate 78,000, 52% sangu
    // Raw = 28.5 * 0.52 * 78000 = 1,155,960
    // Rounded to nearest 1000 = 1,156,000
    const sangu = calculateSangu({
      ratePerTon: 78000,
      unloadedTonnage: 28.5,
      sanguPercentage: 0.52,
    })
    expect(sangu).toBe(1156000)
  })

  it("caps tonnage at standard tonnage (31.0 tons) when tonnage exceeds 31", () => {
    // 31.42 tons, but cap at 31.0 tons
    // Raw = 31.0 * 0.52 * 78000 = 1,257,360
    // Rounded to nearest 1000 = 1,257,000
    const sangu = calculateSangu({
      ratePerTon: 78000,
      unloadedTonnage: 31.42,
      sanguPercentage: 0.52,
    })
    expect(sangu).toBe(1257000)
  })

  it("respects custom standardTonnage if specified", () => {
    // Custom standard tonnage 30.0, unloaded 32.0 tons
    // Raw = 30.0 * 0.50 * 80000 = 1,200,000
    const sangu = calculateSangu({
      ratePerTon: 80000,
      unloadedTonnage: 32.0,
      sanguPercentage: 0.5,
      standardTonnage: 30.0,
    })
    expect(sangu).toBe(1200000)
  })

  it("rounds up when hundreds are >= 500", () => {
    // Suppose raw = 1,000,500 -> rounds to 1,001,000
    // 25 tons * 0.5 * 80040 = 1,000,500 -> 1,001,000
    const sangu = calculateSangu({
      ratePerTon: 80040,
      unloadedTonnage: 25,
      sanguPercentage: 0.5,
    })
    expect(sangu).toBe(1001000)
  })

  it("handles zero or negative values safely", () => {
    expect(
      calculateSangu({
        ratePerTon: 0,
        unloadedTonnage: 30,
        sanguPercentage: 0.52,
      })
    ).toBe(0)
    expect(
      calculateSangu({
        ratePerTon: 78000,
        unloadedTonnage: 0,
        sanguPercentage: 0.52,
      })
    ).toBe(0)
    expect(
      calculateSangu({
        ratePerTon: 78000,
        unloadedTonnage: 30,
        sanguPercentage: 0,
      })
    ).toBe(0)
  })
})
