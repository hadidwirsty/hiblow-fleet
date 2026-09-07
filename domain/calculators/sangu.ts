export interface CalculateSanguInput {
  ratePerTon: number
  unloadedTonnage: number
  sanguPercentage: number
  standardTonnage?: number
}

/**
 * Calculates driver stipend (sangu supir).
 * Formula:
 *   baseTonnage = min(unloadedTonnage, standardTonnage ?? 31.0)
 *   rawSangu = baseTonnage * sanguPercentage * ratePerTon
 *   sangu = ROUND(rawSangu, -3) -> rounded to the nearest thousand (Rp 1,000)
 */
export function calculateSangu(input: CalculateSanguInput): number {
  const {
    ratePerTon,
    unloadedTonnage,
    sanguPercentage,
    standardTonnage = 31.0,
  } = input

  if (ratePerTon <= 0 || unloadedTonnage <= 0 || sanguPercentage <= 0) {
    return 0
  }

  const baseTonnage = Math.min(unloadedTonnage, standardTonnage)
  const rawSangu = baseTonnage * sanguPercentage * ratePerTon

  // ROUND(x, -3) in Excel rounds to the nearest thousand
  return Math.round(rawSangu / 1000) * 1000
}
