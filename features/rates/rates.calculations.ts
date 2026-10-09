/**
 * Logika utilitas kalkulasi murni (pure functions) untuk modul referensi tarif rute armada.
 */

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
