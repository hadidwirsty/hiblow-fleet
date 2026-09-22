import { describe, expect, it } from "vitest"

import { calculateOmset } from "@/domain/calculators/omset"

describe("calculateOmset", () => {
  it("calculates omset correctly with integer tonnages", () => {
    // 30 tons @ Rp 80,000/ton = Rp 2,400,000
    const omset = calculateOmset({
      ratePerTon: 80000,
      unloadedTonnage: 30,
    })
    expect(omset).toBe(2400000)
  })

  it("calculates omset correctly with decimal tonnages", () => {
    // 31.28 tons @ Rp 78,000/ton = Rp 2,439,840
    const omset = calculateOmset({
      ratePerTon: 78000,
      unloadedTonnage: 31.28,
    })
    expect(omset).toBe(2439840)
  })

  it("handles zero tonnage or zero rate gracefully", () => {
    expect(calculateOmset({ ratePerTon: 0, unloadedTonnage: 31 })).toBe(0)
    expect(calculateOmset({ ratePerTon: 78000, unloadedTonnage: 0 })).toBe(0)
  })

  it("rounds properly to 2 decimal places if fractional cents occur", () => {
    const omset = calculateOmset({
      ratePerTon: 75555.55,
      unloadedTonnage: 10.33,
    })
    // 75555.55 * 10.33 = 780488.8315 -> 780488.83
    expect(omset).toBe(780488.83)
  })
})
