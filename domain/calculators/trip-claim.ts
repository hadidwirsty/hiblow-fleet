export interface CalculateTripClaimInput {
  loadedTonnage: number | string
  unloadedTonnage: number | string
  ratePerTon: number | string
  tolerancePercent?: number // default 0.3% (0.003)
}

export interface TripClaimResult {
  isMinus: boolean
  isExceedingTolerance: boolean
  isOverTolerance: boolean
  shrinkageTonnage: number
  toleranceTonnage: number
  claimableTonnage: number
  totalClaimAmount: number
  companyClaim: number
  driverClaim: number
}

/**
 * Menghitung klaim susut muatan minus terhadap batas toleransi 0.3%:
 * - Jika tonase bongkar >= tonase muat: tidak minus, tidak ada klaim (klaim Rp 0).
 * - Jika tonase bongkar < tonase muat:
 *   - Susut Riil = |unloadedTonnage - loadedTonnage|
 *   - Toleransi Susut = loadedTonnage * 0.003 (0.3% muatan awal)
 *   - Jika Susut Riil <= Toleransi Susut: klaim Rp 0 (dalam batas wajar).
 *   - Jika Susut Riil > Toleransi Susut:
 *     - Susut Diklaim = Susut Riil - Toleransi Susut
 *     - Total Klaim = Susut Diklaim * Tarif OA/Ton
 *     - Alokasi: 50% Perusahaan (claim) dan 50% Supir (claimDriver).
 */
export function calculateTripClaim(
  input: CalculateTripClaimInput
): TripClaimResult {
  const loaded =
    typeof input.loadedTonnage === "number"
      ? input.loadedTonnage
      : parseFloat(input.loadedTonnage || "0") || 0

  const unloaded =
    typeof input.unloadedTonnage === "number"
      ? input.unloadedTonnage
      : parseFloat(input.unloadedTonnage || "0") || 0

  const rate =
    typeof input.ratePerTon === "number"
      ? input.ratePerTon
      : parseFloat(input.ratePerTon || "0") || 0

  const tolerancePct = input.tolerancePercent ?? 0.003 // 0.3%

  if (loaded <= 0 || unloaded <= 0) {
    return {
      isMinus: false,
      isExceedingTolerance: false,
      isOverTolerance: false,
      shrinkageTonnage: 0,
      toleranceTonnage: 0,
      claimableTonnage: 0,
      totalClaimAmount: 0,
      companyClaim: 0,
      driverClaim: 0,
    }
  }

  const diff = unloaded - loaded
  if (diff >= 0) {
    return {
      isMinus: false,
      isExceedingTolerance: false,
      isOverTolerance: false,
      shrinkageTonnage: 0,
      toleranceTonnage: Math.round(loaded * tolerancePct * 1000) / 1000,
      claimableTonnage: 0,
      totalClaimAmount: 0,
      companyClaim: 0,
      driverClaim: 0,
    }
  }

  // Kondisi Minus (Susut Muatan)
  const shrinkageTonnage = Math.round(Math.abs(diff) * 1000) / 1000
  const toleranceTonnage = Math.round(loaded * tolerancePct * 1000) / 1000

  if (shrinkageTonnage <= toleranceTonnage) {
    return {
      isMinus: true,
      isExceedingTolerance: false,
      isOverTolerance: false,
      shrinkageTonnage,
      toleranceTonnage,
      claimableTonnage: 0,
      totalClaimAmount: 0,
      companyClaim: 0,
      driverClaim: 0,
    }
  }

  // Melebihi batas toleransi 0.3%
  const claimableTonnage =
    Math.round((shrinkageTonnage - toleranceTonnage) * 1000) / 1000
  const totalClaimAmount = Math.round(claimableTonnage * rate)
  const companyClaim = Math.round(totalClaimAmount * 0.5)
  const driverClaim = totalClaimAmount - companyClaim

  return {
    isMinus: true,
    isExceedingTolerance: true,
    isOverTolerance: true,
    shrinkageTonnage,
    toleranceTonnage,
    claimableTonnage,
    totalClaimAmount,
    companyClaim,
    driverClaim,
  }
}
