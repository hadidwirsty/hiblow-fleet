export interface CalculateOmsetInput {
  ratePerTon: number
  unloadedTonnage: number
}

/**
 * Calculates total omset (gross revenue) for a trip.
 * Formula: omset = ratePerTon * unloadedTonnage
 * Result rounded to 2 decimal places to avoid floating point precision issues.
 */
export function calculateOmset(input: CalculateOmsetInput): number {
  const { ratePerTon, unloadedTonnage } = input

  if (ratePerTon <= 0 || unloadedTonnage <= 0) {
    return 0
  }

  const rawOmset = ratePerTon * unloadedTonnage
  return Math.round(rawOmset * 100) / 100
}
