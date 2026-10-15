import { describe, expect, it } from "vitest"

import { calculateTaxAccounting } from "@/domain/calculators/tax-accounting"

describe("calculateTaxAccounting", () => {
  it("calculates accurate transportation bookkeeping and 3 tax schemes for profitable business", () => {
    // Gross Omset: 100,000,000
    // Revenue Reduction (12.5%): 12,500,000 -> Net Omset: 87,500,000
    // Sangu: 40,000,000, Incentive: 3,500,000, ThirdPartyFee: 1,500,000, FactoryDeduction: 2,000,000
    // Direct Trip Expenses: 47,000,000
    // Truck OPEX: 15,500,000
    // Total Real Expenses: 62,500,000
    // Real Operating Profit: 87,500,000 - 62,500,000 = 25,000,000
    // Tax 1% Withholding Credit: 1,000,000
    const result = calculateTaxAccounting({
      grossOmset: 100000000,
      driverSangu: 40000000,
      driverIncentive: 3500000,
      thirdPartyFee: 1500000,
      factoryDeductions: 2000000,
      truckOpex: 15500000,
      tax1PctWithholding: 1000000,
    })

    // 1. Bookkeeping summary
    expect(result.bookkeeping.grossOmset).toBe(100000000)
    expect(result.bookkeeping.revenueReduction).toBe(12500000)
    expect(result.bookkeeping.netOmset).toBe(87500000)
    expect(result.bookkeeping.directTripExpenses).toBe(47000000)
    expect(result.bookkeeping.truckOpex).toBe(15500000)
    expect(result.bookkeeping.totalRealExpenses).toBe(62500000)
    expect(result.bookkeeping.realOperatingProfit).toBe(25000000)
    expect(result.bookkeeping.tax1PctWithholding).toBe(1000000)

    // 2. Scheme 1: UMKM 0.5%
    // DPP: 100,000,000 * 0.005 = 500,000. No tax credit. Net tax: 500,000.
    const s1 = result.schemes.find((s) => s.schemeId === "umkm_0_5")!
    expect(s1).toBeDefined()
    expect(s1.dpp).toBe(100000000)
    expect(s1.grossTax).toBe(500000)
    expect(s1.taxCredit).toBe(0)
    expect(s1.netTaxPayable).toBe(500000)
    expect(s1.realNetProfitAfterTax).toBe(24500000) // 25,000,000 - 500,000

    // 3. Scheme 2: Norma 29% x 11%
    // DPP: 100,000,000 * 0.29 = 29,000,000
    // Gross Tax: 29,000,000 * 0.11 = 3,190,000
    // Tax Credit: 1,000,000 -> Net Payable: 2,190,000
    const s2 = result.schemes.find((s) => s.schemeId === "norma_29_11")!
    expect(s2).toBeDefined()
    expect(s2.dpp).toBe(29000000)
    expect(s2.grossTax).toBe(3190000)
    expect(s2.taxCredit).toBe(1000000)
    expect(s2.netTaxPayable).toBe(2190000)
    expect(s2.realNetProfitAfterTax).toBe(21810000) // 25,000,000 - 3,190,000

    // 4. Scheme 3: Pembukuan Riil 11%
    // DPP: 25,000,000 (Laba Usaha Riil)
    // Gross Tax: 25,000,000 * 0.11 = 2,750,000
    // Tax Credit: 1,000,000 -> Net Payable: 1,750,000
    const s3 = result.schemes.find((s) => s.schemeId === "real_bookkeeping_11")!
    expect(s3).toBeDefined()
    expect(s3.dpp).toBe(25000000)
    expect(s3.grossTax).toBe(2750000)
    expect(s3.taxCredit).toBe(1000000)
    expect(s3.netTaxPayable).toBe(1750000)
    expect(s3.realNetProfitAfterTax).toBe(22250000) // 25,000,000 - 2,750,000

    // 5. Smart recommendation: UMKM 0.5% (setoran 500rb vs 1.75jt vs 2.19jt)
    expect(result.recommendation.bestSchemeId).toBe("umkm_0_5")
    expect(result.recommendation.cashSavings).toBe(1690000) // 2,190,000 - 500,000
  })

  it("recommends real bookkeeping when business is operating at a loss", () => {
    // Gross Omset: 50,000,000 -> Net Omset: 43,750,000
    // Total Real Expenses: 55,000,000 -> Real Loss: -11,250,000
    // Tax 1% Withholding Credit: 500,000
    const result = calculateTaxAccounting({
      grossOmset: 50000000,
      driverSangu: 30000000,
      driverIncentive: 2000000,
      thirdPartyFee: 1000000,
      factoryDeductions: 1000000,
      truckOpex: 21000000,
      tax1PctWithholding: 500000,
    })

    expect(result.bookkeeping.realOperatingProfit).toBe(-11250000)

    // UMKM 0.5% still pays 250,000 (final tax ignores loss)
    const s1 = result.schemes.find((s) => s.schemeId === "umkm_0_5")!
    expect(s1.netTaxPayable).toBe(250000)

    // Real bookkeeping has 0 tax and 500,000 tax overpayment (lebih bayar)
    const s3 = result.schemes.find((s) => s.schemeId === "real_bookkeeping_11")!
    expect(s3.dpp).toBe(0)
    expect(s3.grossTax).toBe(0)
    expect(s3.netTaxPayable).toBe(0)
    expect(s3.taxOverpayment).toBe(500000)

    expect(result.recommendation.bestSchemeId).toBe("real_bookkeeping_11")
  })

  it("handles zero omset gracefully", () => {
    const result = calculateTaxAccounting({
      grossOmset: 0,
      driverSangu: 0,
      driverIncentive: 0,
      thirdPartyFee: 0,
      factoryDeductions: 0,
      truckOpex: 0,
      tax1PctWithholding: 0,
    })

    expect(result.bookkeeping.grossOmset).toBe(0)
    expect(result.bookkeeping.realOperatingProfit).toBe(0)
    expect(result.schemes.every((s) => s.netTaxPayable === 0)).toBe(true)
  })
})
