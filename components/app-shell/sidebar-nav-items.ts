import {
  RiDashboardLine,
  RiHandCoinLine,
  RiReceiptLine,
  RiTable2,
  RiTruckLine,
} from "@remixicon/react"

export interface NavItem {
  title: string
  href: string
  icon: typeof RiDashboardLine
  badge?: string
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: RiDashboardLine,
  },
  {
    title: "Ritase",
    href: "/trips",
    icon: RiTruckLine,
  },
  {
    title: "Pengeluaran",
    href: "/expenses",
    icon: RiReceiptLine,
  },
  {
    title: "Bagi Hasil",
    href: "/profit-sharing",
    icon: RiHandCoinLine,
  },
  {
    title: "Referensi Tarif",
    href: "/rates",
    icon: RiTable2,
  },
]
