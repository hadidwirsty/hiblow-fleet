import { describe, expect, it } from "vitest"

import { calculateProfitSharing } from "@/src/domain/calculators/profit-sharing"

describe("calculateProfitSharing", () => {
  it("calculates profit distribution accurately for normal profitable month", () => {
    // Total income from trips = 80,000,000
    // Total expenses = 30,000,000
    // Gross balance = 50,000,000
    // Manager commission (5%) = 2,500,000
    // Distributable profit = 47,500,000
    // Fleet valuation = 580,000,000
    // Partners:
    // 1. Alfiah: 50,000,000 (8.620689%) -> 47,500,000 * (50/580) = 4,094,828
    // 2. Mas Dhian: 75,000,000 (12.931034%) -> 47,500,000 * (75/580) = 6,142,241
    // 3. Hadid: 4,000,000 (0.689655%) -> 47,500,000 * (4/580) = 327,586
    // Total partner payouts = 4,094,828 + 6,142,241 + 327,586 = 10,564,655
    // Manager profit = 47,500,000 - 10,564,655 = 36,935,345
    // Manager take home = 36,935,345 + 2,500,000 = 39,435,345
    const result = calculateProfitSharing({
      totalIncome: 80000000,
      totalExpenses: 30000000,
      partners: [
        { name: "Alfiah", capitalShare: 50000000 },
        { name: "Mas Dhian", capitalShare: 75000000 },
        { name: "Hadid", capitalShare: 4000000 },
      ],
    })

    expect(result.grossBalance).toBe(50000000)
    expect(result.managerCommissionAmount).toBe(2500000)
    expect(result.distributableProfit).toBe(47500000)

    const alfiah = result.partnerShares.find((p) => p.name === "Alfiah")
    expect(alfiah?.payoutAmount).toBe(4094828)

    const dhian = result.partnerShares.find((p) => p.name === "Mas Dhian")
    expect(dhian?.payoutAmount).toBe(6142241)

    const hadid = result.partnerShares.find((p) => p.name === "Hadid")
    expect(hadid?.payoutAmount).toBe(327586)

    expect(result.managerProfit).toBe(36935345)
    expect(result.managerTakeHome).toBe(39435345)
  })

  it("handles negative gross balance (loss period) without commission or payout", () => {
    // Total income = 20,000,000, Total expenses = 25,000,000
    // Gross balance = -5,000,000
    const result = calculateProfitSharing({
      totalIncome: 20000000,
      totalExpenses: 25000000,
      partners: [{ name: "Alfiah", capitalShare: 50000000 }],
    })

    expect(result.grossBalance).toBe(-5000000)
    expect(result.managerCommissionAmount).toBe(0)
    expect(result.distributableProfit).toBe(-5000000)
    expect(result.partnerShares[0].payoutAmount).toBe(0)
    expect(result.managerProfit).toBe(-5000000)
    expect(result.managerTakeHome).toBe(-5000000)
  })

  it("allows custom fleet valuation and commission rate", () => {
    const result = calculateProfitSharing({
      totalIncome: 10000000,
      totalExpenses: 0,
      managerCommissionRate: 0.1, // 10%
      fleetValuation: 500000000,
      partners: [{ name: "Partner A", capitalShare: 50000000 }], // 10%
    })

    // Gross = 10,000,000
    // Commission = 1,000,000
    // Distributable = 9,000,000
    // Partner A share 10% = 900,000
    // Manager profit = 8,100,000
    // Manager take home = 8,100,000 + 1,000,000 = 9,100,000
    expect(result.managerCommissionAmount).toBe(1000000)
    expect(result.distributableProfit).toBe(9000000)
    expect(result.partnerShares[0].payoutAmount).toBe(900000)
    expect(result.managerProfit).toBe(8100000)
    expect(result.managerTakeHome).toBe(9100000)
  })
})
