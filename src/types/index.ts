export type TruckId = "W8187UA" | "H8133OF"

export const TRUCK_IDS: TruckId[] = ["W8187UA", "H8133OF"]

export type UserRole = "admin" | "partner"

export type ExpenseCategory =
  | "Servis"
  | "Onderdil"
  | "GPS"
  | "DP/Cicilan"
  | "BBM"
  | "Administrasi"
  | "Lainnya"

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Servis",
  "Onderdil",
  "GPS",
  "DP/Cicilan",
  "BBM",
  "Administrasi",
  "Lainnya",
]

export type ProfitSharingStatus = "draft" | "finalized"

export interface FormattedPartnerShare {
  partnerName: string
  capitalShare: number
  sharePercentage: number
  payoutAmount: number
}
