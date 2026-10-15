import { describe, expect, it } from "vitest"

import { calculateTaxAccounting } from "@/domain/calculators/tax-accounting"
import {
  formatSchemeBadge,
  getSchemeCardColor,
} from "@/features/taxes/tax-comparison-cards"
import { formatWithholdingNotes } from "@/features/taxes/tax-withholding-card"

describe("TaxComparisonCards & TaxWithholdingCard helpers", () => {
  const sampleCalculations = calculateTaxAccounting({
    grossOmset: 100000000,
    driverSangu: 40000000,
    driverIncentive: 3500000,
    thirdPartyFee: 1500000,
    factoryDeductions: 2000000,
    truckOpex: 15500000,
    tax1PctWithholding: 1000000,
  })

  it("determines correct card colors and recommendation badge", () => {
    const s1 = sampleCalculations.schemes.find(
      (s) => s.schemeId === "umkm_0_5"
    )!
    const s2 = sampleCalculations.schemes.find(
      (s) => s.schemeId === "norma_29_11"
    )!

    expect(formatSchemeBadge(s1)).toBe("Paling Hemat Kas")
    expect(formatSchemeBadge(s2)).toBe("Opsi Alternatif")

    expect(getSchemeCardColor(s1.isRecommended)).toContain("emerald")
    expect(getSchemeCardColor(s2.isRecommended)).not.toContain("emerald")
  })

  it("formats tax withholding notes correctly for cement factories", () => {
    const notes = formatWithholdingNotes(1000000, 15)
    expect(notes.totalAmountFormatted).toBe("Rp1.000.000")
    expect(notes.tripCountText).toBe("15 ritase")
    expect(notes.eligibleSchemesText).toContain("Skema Norma (29%)")
    expect(notes.eligibleSchemesText).toContain("Pembukuan Riil")
  })
})
