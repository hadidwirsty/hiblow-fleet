export type TaxSchemeId = "umkm_0_5" | "norma_29_11" | "real_bookkeeping_11"

export interface TaxAccountingInput {
  grossOmset: number
  driverSangu: number
  driverIncentive: number
  thirdPartyFee: number
  factoryDeductions: number
  truckOpex: number
  tax1PctWithholding: number
  revenueReductionRate?: number
  umkmRate?: number
  normaRate?: number
  corporateTaxRate?: number
}

export interface TaxBookkeepingSummary {
  grossOmset: number
  revenueReductionRate: number
  revenueReduction: number
  netOmset: number
  driverSangu: number
  driverIncentive: number
  thirdPartyFee: number
  factoryDeductions: number
  directTripExpenses: number
  truckOpex: number
  totalRealExpenses: number
  realOperatingProfit: number
  tax1PctWithholding: number
}

export interface TaxSchemeCalculation {
  schemeId: TaxSchemeId
  schemeName: string
  description: string
  dpp: number
  rateDisplay: string
  grossTax: number
  taxCredit: number
  netTaxPayable: number
  taxOverpayment: number
  realNetProfitAfterTax: number
  cashBurden: number
  isRecommended: boolean
}

export interface TaxRecommendation {
  bestSchemeId: TaxSchemeId
  bestSchemeName: string
  cashSavings: number
  explanation: string
}

export interface TaxAccountingResult {
  bookkeeping: TaxBookkeepingSummary
  schemes: TaxSchemeCalculation[]
  recommendation: TaxRecommendation
}

export function calculateTaxAccounting(
  input: TaxAccountingInput
): TaxAccountingResult {
  const {
    grossOmset,
    driverSangu,
    driverIncentive,
    thirdPartyFee,
    factoryDeductions,
    truckOpex,
    tax1PctWithholding,
    revenueReductionRate = 0.125,
    umkmRate = 0.005,
    normaRate = 0.29,
    corporateTaxRate = 0.11,
  } = input

  const revenueReduction =
    Math.round(grossOmset * revenueReductionRate * 100) / 100
  const netOmset = Math.round((grossOmset - revenueReduction) * 100) / 100
  const directTripExpenses =
    Math.round(
      (driverSangu + driverIncentive + thirdPartyFee + factoryDeductions) * 100
    ) / 100
  const totalRealExpenses =
    Math.round((directTripExpenses + truckOpex) * 100) / 100
  const realOperatingProfit =
    Math.round((netOmset - totalRealExpenses) * 100) / 100

  // 1. Skema 1: PPh Final UMKM 0.5% (PP 55/2022)
  const s1Dpp = grossOmset
  const s1GrossTax = Math.round(s1Dpp * umkmRate)
  const s1TaxCredit = 0
  const s1NetTaxPayable = s1GrossTax
  const s1TaxOverpayment = 0
  const s1ProfitAfterTax = realOperatingProfit - s1NetTaxPayable
  const s1CashBurden = s1NetTaxPayable

  // 2. Skema 2: Norma Penghitungan (NPPN 29% + PPh 11%)
  const s2Dpp = Math.round(grossOmset * normaRate)
  const s2GrossTax = Math.round(s2Dpp * corporateTaxRate)
  const s2TaxCredit = tax1PctWithholding
  const s2NetTaxPayable = Math.max(0, s2GrossTax - s2TaxCredit)
  const s2TaxOverpayment =
    s2GrossTax < s2TaxCredit ? s2TaxCredit - s2GrossTax : 0
  const s2ProfitAfterTax = realOperatingProfit - s2GrossTax
  const s2CashBurden = s2NetTaxPayable

  // 3. Skema 3: Pembukuan Riil (Laba Bersih Riil + PPh 11%)
  const s3Dpp = Math.max(0, realOperatingProfit)
  const s3GrossTax = Math.round(s3Dpp * corporateTaxRate)
  const s3TaxCredit = tax1PctWithholding
  const s3NetTaxPayable = Math.max(0, s3GrossTax - s3TaxCredit)
  const s3TaxOverpayment =
    s3GrossTax < s3TaxCredit ? s3TaxCredit - s3GrossTax : 0
  const s3ProfitAfterTax = realOperatingProfit - s3GrossTax
  const s3CashBurden = s3NetTaxPayable

  // Smart Recommendation
  const schemesRaw = [
    {
      schemeId: "umkm_0_5" as const,
      schemeName: "PPh Final UMKM 0.5% (PP 55/2022)",
      description:
        "Tarif 0.5% dari Omset Bruto tanpa memperhitungkan beban dan kredit pajak.",
      dpp: s1Dpp,
      rateDisplay: "0.5% Final",
      grossTax: s1GrossTax,
      taxCredit: s1TaxCredit,
      netTaxPayable: s1NetTaxPayable,
      taxOverpayment: s1TaxOverpayment,
      realNetProfitAfterTax: s1ProfitAfterTax,
      cashBurden: s1CashBurden,
    },
    {
      schemeId: "norma_29_11" as const,
      schemeName: "Norma Penghitungan (NPPN 29% + PPh 11%)",
      description:
        "Penghasilan neto ditaksir 29% dari omset, dikenakan tarif fasilitas 11%, dikurangi kredit PPh 1%.",
      dpp: s2Dpp,
      rateDisplay: "Norma 29% × 11%",
      grossTax: s2GrossTax,
      taxCredit: s2TaxCredit,
      netTaxPayable: s2NetTaxPayable,
      taxOverpayment: s2TaxOverpayment,
      realNetProfitAfterTax: s2ProfitAfterTax,
      cashBurden: s2CashBurden,
    },
    {
      schemeId: "real_bookkeeping_11" as const,
      schemeName: "Pembukuan Riil (Laba Bersih + PPh 11%)",
      description:
        "Laba bersih operasional riil setelah koreksi omset 12.5% dan beban riil, dikurangi kredit PPh 1%.",
      dpp: s3Dpp,
      rateDisplay: "Laba Riil × 11%",
      grossTax: s3GrossTax,
      taxCredit: s3TaxCredit,
      netTaxPayable: s3NetTaxPayable,
      taxOverpayment: s3TaxOverpayment,
      realNetProfitAfterTax: s3ProfitAfterTax,
      cashBurden: s3CashBurden,
    },
  ]

  let bestIndex = 0
  let minBurden = schemesRaw[0].cashBurden
  let maxBurden = schemesRaw[0].cashBurden

  for (let i = 1; i < schemesRaw.length; i++) {
    const burden = schemesRaw[i].cashBurden
    if (burden < minBurden) {
      minBurden = burden
      bestIndex = i
    }
    if (burden > maxBurden) {
      maxBurden = burden
    }
  }

  const bestScheme = schemesRaw[bestIndex]
  const cashSavings = maxBurden - minBurden

  const schemes: TaxSchemeCalculation[] = schemesRaw.map((s, idx) => ({
    ...s,
    isRecommended: idx === bestIndex,
  }))

  const explanation =
    cashSavings > 0
      ? `Skema ${bestScheme.schemeName} menghasilkan setoran kas paling hemat sebesar Rp ${minBurden.toLocaleString("id-ID")}, memberikan penghematan kas hingga Rp ${cashSavings.toLocaleString("id-ID")} dibandingkan opsi lainnya.`
      : `Seluruh skema menghasilkan kewajiban kas yang seimbang pada periode ini.`

  return {
    bookkeeping: {
      grossOmset,
      revenueReductionRate,
      revenueReduction,
      netOmset,
      driverSangu,
      driverIncentive,
      thirdPartyFee,
      factoryDeductions,
      directTripExpenses,
      truckOpex,
      totalRealExpenses,
      realOperatingProfit,
      tax1PctWithholding,
    },
    schemes,
    recommendation: {
      bestSchemeId: bestScheme.schemeId,
      bestSchemeName: bestScheme.schemeName,
      cashSavings,
      explanation,
    },
  }
}
