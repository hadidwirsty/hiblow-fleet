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
  totalDeductions: number
}

/**
 * Calculates net profit for a single trip.
 * Design Decision #3:
 *   Special deductions (tax 1%, pot 2% LJU, 5% UJ GRB) only apply for Grobogan / PT LJU routes
 *   and explicitly deduct from company profit, never from driver's sangu.
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
    savings = 0,
    claim = 0,
    claimDriver = 0,
    hasSpecialDeductions = false,
  } = input

  let tax1Pct = input.tax1Pct ?? 0
  let deduction2PctLju = input.deduction2PctLju ?? 0
  let deduction5PctUjGrb = input.deduction5PctUjGrb ?? 0

  if (hasSpecialDeductions) {
    if (input.tax1Pct === undefined) {
      tax1Pct = Math.round(omset * 0.01 * 100) / 100
    }
    if (input.deduction2PctLju === undefined) {
      deduction2PctLju = Math.round(omset * 0.02 * 100) / 100
    }
    if (input.deduction5PctUjGrb === undefined) {
      deduction5PctUjGrb = Math.round(sangu * 0.05 * 100) / 100
    }
  } else {
    // If not special deductions route and not explicitly provided, keep 0
    if (input.tax1Pct === undefined) tax1Pct = 0
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
    savings +
    claim +
    claimDriver

  const profit = Math.round((omset - directExpenses) * 100) / 100

  return {
    profit,
    tax1Pct,
    deduction2PctLju,
    deduction5PctUjGrb,
    totalDeductions: directExpenses,
  }
}
