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

  it("calculates special deductions for Grobogan/LJU route and reduces profit", () => {
    // Design Decision #3:
    // Pajak 1% (omset * 0.01), Pot 2% LJU (omset * 0.02), 5% UJ GRB (sangu * 0.05)
    // Sangu supir tidak boleh dipotong oleh potongan ini, hanya memotong profit perusahaan
    // Omset: 2,000,000
    // Sangu: 1,000,000
    // tax1Pct = 20,000
    // deduction2PctLju = 40,000
    // deduction5PctUjGrb = 50,000
    // Expected Profit = 2,000,000 - 1,000,000 - 20,000 - 40,000 - 50,000 = 890,000
    const result = calculateTripProfit({
      omset: 2000000,
      sangu: 1000000,
      hasSpecialDeductions: true,
    })

    expect(result.tax1Pct).toBe(20000)
    expect(result.deduction2PctLju).toBe(40000)
    expect(result.deduction5PctUjGrb).toBe(50000)
    expect(result.profit).toBe(890000)
  })

  it("deducts meal allowance, savings, and claims when present", () => {
    const result = calculateTripProfit({
      omset: 2500000,
      sangu: 1250000,
      incentivePaid: 35000,
      mealAllowance: 50000,
      savings: 25000,
      claim: 40000,
      claimDriver: 10000,
    })

    // 2500000 - 1250000 - 35000 - 50000 - 25000 - 40000 - 10000 = 1,090,000
    expect(result.profit).toBe(1090000)
  })

  it("allows custom overrides for special deductions if already recorded", () => {
    const result = calculateTripProfit({
      omset: 2000000,
      sangu: 1000000,
      hasSpecialDeductions: true,
      tax1Pct: 25000, // Custom override
    })

    // tax1Pct overridden to 25000, deduction2Pct = 40000, deduction5Pct = 50000
    // Profit = 2,000,000 - 1,000,000 - 25,000 - 40,000 - 50,000 = 885,000
    expect(result.tax1Pct).toBe(25000)
    expect(result.profit).toBe(885000)
  })
})
