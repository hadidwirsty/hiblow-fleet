import { describe, expect, it } from "vitest"

import { calculateTaxAccounting } from "@/domain/calculators/tax-accounting"
import { formatBookkeepingRowData } from "@/features/taxes/tax-accounting-table"

describe("TaxAccountingTable helper functions", () => {
  const sampleCalculations = calculateTaxAccounting({
    grossOmset: 100000000,
    driverSangu: 40000000,
    driverIncentive: 3500000,
    thirdPartyFee: 1500000,
    factoryDeductions: 2000000,
    truckOpex: 15500000,
    tax1PctWithholding: 1000000,
  })

  it("structures 5 sections of transportation bookkeeping accurately", () => {
    const sections = formatBookkeepingRowData(sampleCalculations, [
      { category: "Servis & Perbaikan", total: 10000000, count: 2 },
      { category: "Onderdil / Ban", total: 4000000, count: 1 },
      { category: "Administrasi & Tol", total: 1500000, count: 1 },
    ])

    // Section 1: Revenue
    expect(sections.revenue.grossOmset).toBe(100000000)
    expect(sections.revenue.revenueReduction).toBe(12500000)
    expect(sections.revenue.netOmset).toBe(87500000)

    // Section 2: Direct Trip Expenses
    expect(sections.directExpenses.total).toBe(47000000)

    // Section 3: Truck OPEX
    expect(sections.opex.total).toBe(15500000)
    expect(sections.opex.categories).toHaveLength(3)

    // Section 4: Operating Profit
    expect(sections.operatingProfit).toBe(25000000)

    // Section 5: Scheme Comparison
    expect(sections.schemes).toHaveLength(3)
  })
})
