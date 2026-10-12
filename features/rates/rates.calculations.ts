/**
 * Logika utilitas kalkulasi murni (pure functions) untuk modul referensi tarif rute armada.
 */

import type { RateReference } from "@/db/schema"

export interface AdditionalTonnageCalculationResult {
  isPercentage: boolean
  percentage: number
}

/**
 * Menentukan apakah nilai tarif lebih tonase (additionalTonnageRate)
 * diturunkan secara langsung dari persentase terhadap tarif dasar OA per ton (ratePerTon).
 *
 * Contoh:
 * - ratePerTon = 47.869, additionalTonnageRate = 14.361
 *   -> 14.361 / 47.869 ≈ 30% -> isPercentage: true, percentage: 30
 * - ratePerTon = 214.500, additionalTonnageRate = 25.000
 *   -> Nominal tetap acuan manual -> isPercentage: false, percentage: 0
 */
export function resolveAdditionalTonnageCalculation(
  ratePerTon: number,
  additionalRate: number
): AdditionalTonnageCalculationResult {
  const roundedTarif = Math.round(ratePerTon)
  if (roundedTarif > 0 && additionalRate > 0) {
    const rawRatio = (additionalRate / roundedTarif) * 100
    const roundedRatio = Math.round(rawRatio)
    if (
      Math.round(roundedTarif * (roundedRatio / 100)) ===
      Math.round(additionalRate)
    ) {
      return { isPercentage: true, percentage: roundedRatio }
    }
  }
  return { isPercentage: false, percentage: 0 }
}

/**
 * Hasil kalkulasi metrik finansial per baris referensi tarif rute.
 */
export interface RowFinancialMetrics {
  numRate: number
  numTon: number
  numPct: number
  rowJumlah: number
  formulaSangu: number
  parsedDefaultSangu: number
  isLegacyThousandRounding: boolean
  isManualOverride: boolean
  rowSangu: number
  rowProfit: number
}

/**
 * Menghitung metrik finansial per baris rute secara terpusat (DRY):
 * - Estimasi jumlah pendapatan (berbasis estimatedRevenue untuk Indocement atau rate * tonase)
 * - Formula uang sangu supir
 * - Penanganan manual default sangu supir & pembulatan historis
 * - Estimasi laba bersih (berbasis estimatedProfitTotal atau jumlah - sangu)
 */
export function resolveRowFinancialMetrics(
  rate: Pick<
    RateReference,
    | "ratePerTon"
    | "standardTonnage"
    | "sanguPercentage"
    | "defaultSangu"
    | "estimatedRevenue"
    | "estimatedProfitTotal"
  >
): RowFinancialMetrics {
  const numRate = parseFloat(rate.ratePerTon || "0")
  const numTon = parseFloat(rate.standardTonnage || "31")
  const numPct = parseFloat(rate.sanguPercentage || "0")
  const rowJumlah = rate.estimatedRevenue
    ? parseFloat(rate.estimatedRevenue)
    : Math.round(numRate * numTon)
  const formulaSangu = Math.round(rowJumlah * numPct)

  const parsedDefaultSangu = rate.defaultSangu
    ? parseFloat(rate.defaultSangu)
    : 0
  const isLegacyThousandRounding =
    parsedDefaultSangu > 0 &&
    formulaSangu > 0 &&
    Math.abs(parsedDefaultSangu - Math.round(formulaSangu / 1000) * 1000) ===
      0 &&
    Math.abs(parsedDefaultSangu - formulaSangu) < 1000

  const isManualOverride = parsedDefaultSangu > 0 && !isLegacyThousandRounding
  const rowSangu = isManualOverride ? parsedDefaultSangu : formulaSangu
  const rowProfit = rate.estimatedProfitTotal
    ? parseFloat(rate.estimatedProfitTotal)
    : rowJumlah - rowSangu

  return {
    numRate,
    numTon,
    numPct,
    rowJumlah,
    formulaSangu,
    parsedDefaultSangu,
    isLegacyThousandRounding,
    isManualOverride,
    rowSangu,
    rowProfit,
  }
}
