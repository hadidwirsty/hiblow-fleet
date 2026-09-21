import { describe, expect, it } from "vitest"

import { calculateOmset } from "@/domain/calculators/omset"
import { calculateSangu } from "@/domain/calculators/sangu"
import { calculateTripProfit } from "@/domain/calculators/trip-profit"

describe("Trip form live calculation integration", () => {
  it("calculates omset, sangu, and profit for standard SI Tuban route", () => {
    const ratePerTon = 95000
    const unloadedTonnage = 31.0
    const sanguPct = 0.52

    const omset = calculateOmset({ ratePerTon, unloadedTonnage })
    const sangu = calculateSangu({
      ratePerTon,
      unloadedTonnage,
      sanguPercentage: sanguPct,
    })
    const profitResult = calculateTripProfit({
      omset,
      sangu,
      thirdPartyFee: 0,
      tax1Pct: 0,
      deduction2PctLju: 0,
      deduction5PctUjGrb: 0,
    })

    expect(omset).toBe(2945000)
    expect(sangu).toBe(1531000)
    expect(profitResult.profit).toBe(1414000)
  })

  it("caps sangu tonnage at 31.0 ton even if actual unloaded tonnage is 32.5 ton", () => {
    const ratePerTon = 95000
    const actualTonnage = 32.5
    const sanguPct = 0.52

    const omset = calculateOmset({ ratePerTon, unloadedTonnage: actualTonnage })
    const sangu = calculateSangu({
      ratePerTon,
      unloadedTonnage: actualTonnage,
      sanguPercentage: sanguPct,
    })
    const profitResult = calculateTripProfit({
      omset,
      sangu,
      thirdPartyFee: 0,
      tax1Pct: 0,
      deduction2PctLju: 0,
      deduction5PctUjGrb: 0,
    })

    expect(omset).toBe(3087500)
    expect(sangu).toBe(1531000) // Capped at 31 ton!
    expect(profitResult.profit).toBe(3087500 - 1531000)
  })

  it("correctly deducts Grobogan / PT LJU special deductions from company profit, not sangu", () => {
    const ratePerTon = 110000
    const unloadedTonnage = 31.0
    const sanguPct = 0.5

    const omset = calculateOmset({ ratePerTon, unloadedTonnage })
    const sangu = calculateSangu({
      ratePerTon,
      unloadedTonnage,
      sanguPercentage: sanguPct,
    })

    const tax1Pct = Math.round(0.01 * omset)
    const deduction2PctLju = Math.round(0.02 * omset)
    const deduction5PctUjGrb = Math.round(0.05 * omset)

    const profitResult = calculateTripProfit({
      omset,
      sangu,
      thirdPartyFee: 0,
      tax1Pct,
      deduction2PctLju,
      deduction5PctUjGrb,
    })

    expect(omset).toBe(3410000)
    expect(sangu).toBe(1705000) // Sangu remains untouched!
    expect(tax1Pct).toBe(34100)
    expect(deduction2PctLju).toBe(68200)
    expect(deduction5PctUjGrb).toBe(170500)
    expect(profitResult.profit).toBe(3410000 - 1705000 - 34100 - 68200 - 170500)
  })

  it("calculates profit correctly when driver sangu is manually overridden (e.g. extra ton or special case)", () => {
    const ratePerTon = 95000
    const actualTonnage = 32.5
    const omset = calculateOmset({ ratePerTon, unloadedTonnage: actualTonnage })

    // Suppose admin manually sets driver sangu to Rp 1.650.000 instead of default formula
    const manualSangu = 1650000

    const profitResult = calculateTripProfit({
      omset,
      sangu: manualSangu,
      thirdPartyFee: 50000,
      tax1Pct: 0,
      deduction2PctLju: 0,
      deduction5PctUjGrb: 0,
    })

    expect(omset).toBe(3087500)
    // Profit must respect the manual sangu value
    expect(profitResult.profit).toBe(3087500 - 1650000 - 50000)
  })

  it("handles flat default sangu from rate reference if available", () => {
    const ratePerTon = 110000
    const unloadedTonnage = 31.0
    const defaultSangu = 1650000

    const omset = calculateOmset({ ratePerTon, unloadedTonnage })
    // Route has flat default sangu (e.g. SBI Tuban or fixed UJ)
    const sanguToUse = defaultSangu

    const profitResult = calculateTripProfit({
      omset,
      sangu: sanguToUse,
      thirdPartyFee: 0,
      tax1Pct: 0,
      deduction2PctLju: 0,
      deduction5PctUjGrb: 0,
    })

    expect(omset).toBe(3410000)
    expect(profitResult.profit).toBe(3410000 - 1650000)
  })
})
