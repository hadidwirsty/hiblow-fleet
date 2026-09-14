export interface InvestorShareItem {
  partnerUserId?: string | null
  payoutAmount: string | number
}

export interface PeriodWithSharesItem {
  id: string
  shares?: InvestorShareItem[] | null
}

/**
 * Extracts a map of { periodId -> payoutAmount } for the given investor userId.
 * Pure function — no I/O, no side effects.
 *
 * @param periods - Array of periods with their shares
 * @param userId - The authenticated investor's user ID
 * @returns Map<periodId, payoutAmount> only for the matching investor
 */
export function extractMyShares(
  periods: PeriodWithSharesItem[],
  userId: string
): Map<string, number> {
  const result = new Map<string, number>()
  if (!userId || !Array.isArray(periods)) return result

  for (const period of periods) {
    if (!period.shares || !Array.isArray(period.shares)) continue
    const myShare = period.shares.find(
      (share) => share.partnerUserId === userId
    )
    if (myShare) {
      const amount =
        typeof myShare.payoutAmount === "number"
          ? myShare.payoutAmount
          : parseFloat(myShare.payoutAmount)
      result.set(period.id, isNaN(amount) ? 0 : amount)
    }
  }

  return result
}
