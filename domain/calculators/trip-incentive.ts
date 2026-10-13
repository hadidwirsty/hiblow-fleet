export interface CalculateTripIncentiveInput {
  loadedTonnage: number | string
  unloadedTonnage: number | string
  standardTonnage?: number | string
  additionalTonnageRate?: number | string
}

export interface TripIncentiveResult {
  excessTonnage: number
  incentivePaid: number
  isEligible: boolean
  tonnageDifference: number
  baseTonnage: number
}

/**
 * Menghitung kelebihan tonase dan insentif dibayarkan untuk supir:
 * - Basis acuan tonase muatan: jika `standardTonnage` diberikan (> 0, misal standar armada 31.00 ton),
 *   maka kelebihan tonase dihitung terhadap kapasitas standar armada tersebut.
 *   Jika tidak diberikan, fallback ke `loadedTonnage` surat jalan.
 * - Selisih = Tonase Bongkar - Base Tonnage
 * - Batas ambang minimal: 0.85 ton.
 *   - Jika selisih <= 0.85 ton -> kelebihan = 0 ton (belum dibayarkan).
 *   - Jika selisih > 0.85 ton -> kelebihan dihitung bertingkat: Math.ceil(selisih - 0.85)
 *     (0.86 - 1.85 ton = 1 ton; 1.86 - 2.85 ton = 2 ton; dst.)
 * - Insentif dibayarkan = excessTonnage * additionalTonnageRate
 */
export function calculateTripIncentive(
  input: CalculateTripIncentiveInput
): TripIncentiveResult {
  const loaded =
    typeof input.loadedTonnage === "number"
      ? input.loadedTonnage
      : parseFloat(input.loadedTonnage || "0") || 0

  const unloaded =
    typeof input.unloadedTonnage === "number"
      ? input.unloadedTonnage
      : parseFloat(input.unloadedTonnage || "0") || 0

  const std =
    typeof input.standardTonnage === "number"
      ? input.standardTonnage
      : input.standardTonnage
        ? parseFloat(input.standardTonnage) || 0
        : 0

  const rate =
    typeof input.additionalTonnageRate === "number"
      ? input.additionalTonnageRate
      : parseFloat(input.additionalTonnageRate || "0") || 0

  if (loaded <= 0 || unloaded <= 0) {
    return {
      excessTonnage: 0,
      incentivePaid: 0,
      isEligible: false,
      tonnageDifference: 0,
      baseTonnage: 0,
    }
  }

  // Basis acuan tonase muat untuk hak insentif supir
  const baseTonnage = std > 0 ? std : loaded
  const rawDiff = unloaded - baseTonnage
  const tonnageDifference = Math.round(rawDiff * 100) / 100

  // Jika selisih <= 0.85 ton, belum memenuhi ambang batas kelebihan 1 ton
  if (tonnageDifference <= 0.85) {
    return {
      excessTonnage: 0,
      incentivePaid: 0,
      isEligible: false,
      tonnageDifference,
      baseTonnage,
    }
  }

  // Bertingkat setiap kelipatan 1 ton di atas 0.85 ton
  // Contoh: 0.86 - 0.85 = 0.01 -> Math.ceil = 1 ton
  // Contoh: 1.85 - 0.85 = 1.00 -> Math.ceil = 1 ton
  // Contoh: 1.86 - 0.85 = 1.01 -> Math.ceil = 2 ton
  const excessTonnage = Math.ceil(
    Math.round((tonnageDifference - 0.85) * 100) / 100
  )
  const incentivePaid = Math.round(excessTonnage * rate)

  return {
    excessTonnage,
    incentivePaid,
    isEligible: true,
    tonnageDifference,
    baseTonnage,
  }
}
