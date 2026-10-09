export interface IndocementCalculationInput {
  ratePerTon: number
  standardTonnage?: number
  sanguPercentage?: number
  overrideSangu?: number
}

export interface IndocementCalculationResult {
  saving5Percent: number
  deduction2Percent: number
  ljuDeduction: number
  oaDriver: number
  estimatedRevenue: number
  uj31Ton: number
  estimatedProfitBase: number
  totalSaving: number
  estimatedProfitTotal: number
}

/**
 * Menghitung parameter khusus rute Indocement - Grobogan.
 * Rumus Resmi Ground Truth Excel:
 * - Saving 5% = 5% x Tarif OA per Ton
 * - Potongan 2% = 2% x Tarif OA per Ton
 * - Potongan LJU = Tonase Standar x Potongan 2%
 * - OA Driver = Tarif OA per Ton - Saving 5% - Potongan 2%
 * - Pendapatan (Estimasi Jumlah) = OA Driver x Tonase Standar
 * - UJ 31 Ton (Sangu Supir) = Pendapatan x Persentase Sangu (atau overrideSangu)
 * - Keuntungan = Pendapatan - UJ 31 Ton
 * - Saving = Saving 5% x Tonase Standar
 * - Profit = Keuntungan + Saving
 */
export function calculateIndocementParameters(
  input: IndocementCalculationInput
): IndocementCalculationResult {
  const rate = Math.max(0, input.ratePerTon || 0)
  const tonnage = Math.max(0, input.standardTonnage ?? 31)

  if (rate === 0 || tonnage === 0) {
    return {
      saving5Percent: 0,
      deduction2Percent: 0,
      ljuDeduction: 0,
      oaDriver: 0,
      estimatedRevenue: 0,
      uj31Ton: 0,
      estimatedProfitBase: 0,
      totalSaving: 0,
      estimatedProfitTotal: 0,
    }
  }

  // 1. Saving 5%
  const saving5Percent = Math.round(rate * 0.05 * 100) / 100

  // 2. Potongan 2%
  const deduction2Percent = Math.round(rate * 0.02 * 100) / 100

  // 3. Potongan LJU = Tonase x Potongan 2%
  const ljuDeduction = Math.round(tonnage * deduction2Percent * 100) / 100

  // 4. OA Driver = Tarif OA - Saving 5% - Potongan 2%
  const oaDriver =
    Math.round((rate - saving5Percent - deduction2Percent) * 100) / 100

  // 5. Pendapatan = OA Driver x Tonase
  const estimatedRevenue = Math.round(oaDriver * tonnage)

  // 6. UJ 31 Ton (Sangu)
  let uj31Ton = 0
  if (
    input.overrideSangu !== undefined &&
    input.overrideSangu !== null &&
    input.overrideSangu > 0
  ) {
    uj31Ton = Math.round(input.overrideSangu)
  } else if (input.sanguPercentage && input.sanguPercentage > 0) {
    const pct =
      input.sanguPercentage <= 1
        ? input.sanguPercentage
        : input.sanguPercentage / 100
    uj31Ton = Math.round(estimatedRevenue * pct)
  }

  // 7. Keuntungan = Pendapatan - UJ 31 Ton
  const estimatedProfitBase = estimatedRevenue - uj31Ton

  // 8. Saving Total = Saving 5% x Tonase
  const totalSaving = Math.round(saving5Percent * tonnage)

  // 9. Profit Total = Keuntungan + Saving
  const estimatedProfitTotal = estimatedProfitBase + totalSaving

  return {
    saving5Percent,
    deduction2Percent,
    ljuDeduction,
    oaDriver,
    estimatedRevenue,
    uj31Ton,
    estimatedProfitBase,
    totalSaving,
    estimatedProfitTotal,
  }
}
