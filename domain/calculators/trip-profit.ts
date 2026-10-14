export interface CalculateTripProfitInput {
  omset: number
  sangu: number
  incentivePaid?: number
  thirdPartyFee?: number
  mealAllowance?: number
  savings?: number
  claim?: number
  claimDriver?: number
  hasSpecialDeductions?: boolean
  tax1Pct?: number
  deduction2PctLju?: number
  deduction5PctUjGrb?: number
}

export interface TripProfitResult {
  profit: number
  tax1Pct: number
  deduction2PctLju: number
  deduction5PctUjGrb: number
  savings: number
  totalDeductions: number
  totalArmadaValue: number
}

/**
 * Calculates net profit and fleet value for a single trip.
 * Design Decision #3 & Konfirmasi Resmi Mas Hafidz (Pilihan A):
 *   - Special deductions rute Indocement Grobogan / PT LJU (total 7%):
 *     1. Potongan Operasional LJU 2% (omset * 0.02) -> Memotong laba operasional tunai
 *     2. Tabungan Kas Armada (Saving 5%) (omset * 0.05) -> Dicatat sebagai tabungan armada di PT LJU
 *     3. Pajak PPh 1% -> Dihapus (0%)
 *   - Laba Operasional Bersih = Omset - Beban Operasional Langsung
 *   - Total Nilai Armada = Laba Operasional Bersih + Tabungan Kas Armada (Saving 5%)
 */
export function calculateTripProfit(
  input: CalculateTripProfitInput
): TripProfitResult {
  const {
    omset,
    sangu,
    incentivePaid = 0,
    thirdPartyFee = 0,
    mealAllowance = 0,
    claim = 0,
    claimDriver = 0,
    hasSpecialDeductions = false,
  } = input

  let tax1Pct = input.tax1Pct ?? 0
  let deduction2PctLju = input.deduction2PctLju ?? 0
  let deduction5PctUjGrb = input.deduction5PctUjGrb ?? 0
  let savings = input.savings ?? 0

  if (hasSpecialDeductions) {
    if (input.tax1Pct === undefined) {
      tax1Pct = 0
    }
    if (input.deduction2PctLju === undefined) {
      deduction2PctLju = Math.round(omset * 0.02 * 100) / 100
    }
    if (input.deduction5PctUjGrb === undefined) {
      deduction5PctUjGrb = 0
    }
    if (input.savings === undefined) {
      savings = Math.round(omset * 0.05 * 100) / 100
    }
  } else {
    // Pabrik selain Indocement Grobogan (SI Tuban, SI Rembang, SBI Tuban):
    // Dikenakan Pajak PPh 1% dari Omset Bruto jika tidak ditentukan manual
    if (input.tax1Pct === undefined) {
      tax1Pct = Math.round(omset * 0.01 * 100) / 100
    }
    if (input.deduction2PctLju === undefined) deduction2PctLju = 0
    if (input.deduction5PctUjGrb === undefined) deduction5PctUjGrb = 0
  }

  const directExpenses =
    sangu +
    incentivePaid +
    thirdPartyFee +
    tax1Pct +
    deduction2PctLju +
    deduction5PctUjGrb +
    mealAllowance +
    claim +
    claimDriver

  const profit = Math.round((omset - directExpenses) * 100) / 100
  const totalArmadaValue = Math.round((profit + savings) * 100) / 100

  return {
    profit,
    tax1Pct,
    deduction2PctLju,
    deduction5PctUjGrb,
    savings,
    totalDeductions: directExpenses,
    totalArmadaValue,
  }
}
