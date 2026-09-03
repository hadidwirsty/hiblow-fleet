export interface PartnerInput {
  name: string
  capitalShare: number
  partnerUserId?: string
}

export interface PartnerShareResult {
  name: string
  partnerUserId?: string
  capitalShare: number
  sharePercentage: number
  payoutAmount: number
}

export interface CalculateProfitSharingInput {
  totalIncome: number
  totalExpenses: number
  managerCommissionRate?: number
  fleetValuation?: number
  partners: PartnerInput[]
}

export interface ProfitSharingResult {
  grossBalance: number
  managerCommissionRate: number
  managerCommissionAmount: number
  distributableProfit: number
  fleetValuation: number
  partnerShares: PartnerShareResult[]
  totalPartnerPayouts: number
  managerProfit: number
  managerTakeHome: number
}

/**
 * Calculates profit sharing for a given period.
 * Standards per HW Trans Excel 'Bagi Hasil' sheet:
 *   - grossBalance = totalIncome - totalExpenses
 *   - managerCommission = grossBalance * commissionRate (default 5%) if grossBalance > 0 else 0
 *   - distributableProfit = grossBalance - managerCommission
 *   - partnerPayout = Math.round(distributableProfit * (capitalShare / fleetValuation)) if distributableProfit > 0 else 0
 *   - managerProfit = distributableProfit - sum(partnerPayouts)
 *   - managerTakeHome = managerProfit + managerCommission
 */
export function calculateProfitSharing(
  input: CalculateProfitSharingInput
): ProfitSharingResult {
  const {
    totalIncome,
    totalExpenses,
    managerCommissionRate = 0.05,
    fleetValuation = 580000000,
    partners,
  } = input

  const grossBalance = Math.round((totalIncome - totalExpenses) * 100) / 100

  const isProfitable = grossBalance > 0
  const managerCommissionAmount = isProfitable
    ? Math.round(grossBalance * managerCommissionRate)
    : 0

  const distributableProfit = grossBalance - managerCommissionAmount

  let totalPartnerPayouts = 0
  const partnerShares: PartnerShareResult[] = partners.map((partner) => {
    const sharePercentage =
      fleetValuation > 0 ? partner.capitalShare / fleetValuation : 0
    const payoutAmount =
      isProfitable && distributableProfit > 0
        ? Math.round(distributableProfit * sharePercentage)
        : 0

    totalPartnerPayouts += payoutAmount

    return {
      name: partner.name,
      partnerUserId: partner.partnerUserId,
      capitalShare: partner.capitalShare,
      sharePercentage,
      payoutAmount,
    }
  })

  const managerProfit = isProfitable
    ? distributableProfit - totalPartnerPayouts
    : distributableProfit

  const managerTakeHome = managerProfit + managerCommissionAmount

  return {
    grossBalance,
    managerCommissionRate,
    managerCommissionAmount,
    distributableProfit,
    fleetValuation,
    partnerShares,
    totalPartnerPayouts,
    managerProfit,
    managerTakeHome,
  }
}
