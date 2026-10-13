import { describe, expect, it } from "vitest"

import { calculateTripProfit } from "@/domain/calculators/trip-profit"

describe("calculateTripProfit", () => {
  it("calculates normal trip profit without special deductions", () => {
    // Omset: 2,400,000
    // Sangu: 1,200,000
    // Incentive: 35,000
    // Third party fee: 50,000
    // Expected Profit = 2,400,000 - 1,200,000 - 35,000 - 50,000 = 1,115,000
    const result = calculateTripProfit({
      omset: 2400000,
      sangu: 1200000,
      incentivePaid: 35000,
      thirdPartyFee: 50000,
      hasSpecialDeductions: false,
    })

    expect(result.profit).toBe(1115000)
    expect(result.tax1Pct).toBe(0)
    expect(result.deduction2PctLju).toBe(0)
    expect(result.deduction5PctUjGrb).toBe(0)
  })

  it("calculates special deductions for Grobogan/LJU route according to Option A (7% total: 2% LJU + 5% fleet savings, 0% tax)", () => {
    // Ground Truth Pilihan A Mas Hafidz:
    // Pajak 1% = 0 (dihapus)
    // Potongan LJU 2% = omset * 0.02
    // Saving 5% = omset * 0.05 (tabungan armada, bukan biaya hangus)
    // UJ GRB 5% = 0 (karena dialihkan ke tabungan saving)
    // Omset: 5,250,000
    // Sangu: 2,441,250
    // deduction2PctLju = 105,000
    // savings = 262,500
    // Profit Operasional = 5,250,000 - 2,441,250 - 105,000 = 2,703,750
    // Total Nilai Armada = Profit (2,703,750) + Tabungan Saving (262,500) = 2,966,250
    const result = calculateTripProfit({
      omset: 5250000,
      sangu: 2441250,
      hasSpecialDeductions: true,
    })

    expect(result.tax1Pct).toBe(0)
    expect(result.deduction2PctLju).toBe(105000)
    expect(result.deduction5PctUjGrb).toBe(0)
    expect(result.savings).toBe(262500)
    expect(result.profit).toBe(5250000 - 2441250 - 105000)
    expect(result.totalArmadaValue).toBe(result.profit + result.savings)
  })

  it("deducts meal allowance, custom savings, and claims when present", () => {
    const result = calculateTripProfit({
      omset: 2500000,
      sangu: 1250000,
      incentivePaid: 35000,
      mealAllowance: 50000,
      savings: 25000,
      claim: 40000,
      claimDriver: 10000,
    })

    // 2500000 - 1250000 - 35000 - 50000 - 40000 - 10000 = 1,115,000 (profit operasional)
    // Total armada value = 1,115,000 + 25,000 (savings) = 1,140,000
    expect(result.profit).toBe(1115000)
    expect(result.savings).toBe(25000)
    expect(result.totalArmadaValue).toBe(1140000)
  })

  it("allows custom overrides for special deductions if explicitly provided (e.g. historical data)", () => {
    const result = calculateTripProfit({
      omset: 2000000,
      sangu: 1000000,
      hasSpecialDeductions: true,
      tax1Pct: 20000, // Explicit historical tax
      deduction2PctLju: 40000,
      deduction5PctUjGrb: 50000,
      savings: 0,
    })

    // Profit = 2,000,000 - 1,000,000 - 20,000 - 40,000 - 50,000 = 890,000
    expect(result.tax1Pct).toBe(20000)
    expect(result.deduction2PctLju).toBe(40000)
    expect(result.deduction5PctUjGrb).toBe(50000)
    expect(result.profit).toBe(890000)
  })
})
