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

export interface ModalDeleteState {
  open: boolean
  title?: string
  message?: string
  type?: string
  action?: () => void | Promise<void>
}

export interface ModalInactiveState {
  open: boolean
  title?: string
  message?: string
  actionMessage?: string
  type?: string
  action?: () => void | Promise<void>
}

export interface ModalSuccessState {
  open: boolean
  title?: string
  message?: string
  actionMessage?: string
  actionVariant?:
    "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  animation?: "success" | "alert" | "warning" | "notification"
  action?: () => void | Promise<void>
}

export interface ThemeStore {
  isSidebarOpen: boolean
  loading: boolean
  modalDelete: ModalDeleteState
  modalInactive: ModalInactiveState
  modalSuccess: ModalSuccessState
  setLoading: (loading: boolean) => void
  setModalDelete: (modal: Partial<ModalDeleteState>) => void
  setModalInactive: (modal: Partial<ModalInactiveState>) => void
  setModalSuccess: (modal: Partial<ModalSuccessState>) => void
  toggleSidebar: () => void
}

export type IThemeStore = ThemeStore
