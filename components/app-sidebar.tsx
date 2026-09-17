"use client"

import * as React from "react"
import Link from "next/link"
import {
  RiDashboardLine,
  RiHandCoinLine,
  RiQuestionLine,
  RiReceiptLine,
  RiTable2,
  RiTruckLine,
} from "@remixicon/react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Mas Hafidz",
    email: "hafidz@hiblow.fleet",
    role: "Super Admin",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <RiDashboardLine className="size-4" />,
    },
    {
      title: "Manajemen Ritase",
      url: "/trips",
      icon: <RiTruckLine className="size-4" />,
    },
    {
      title: "Pengeluaran Truk",
      url: "/expenses",
      icon: <RiReceiptLine className="size-4" />,
    },
    {
      title: "Bagi Hasil Pemodal",
      url: "/profit-sharing",
      icon: <RiHandCoinLine className="size-4" />,
    },
    {
      title: "Referensi Tarif",
      url: "/rates",
      icon: <RiTable2 className="size-4" />,
    },
  ],
  armada: [
    {
      name: "W 8187 UA",
      url: "/trips?truckId=W8187UA",
      subtitle: "Supir: Triyono",
      status: "Beroperasi",
    },
    {
      name: "H 8133 OF",
      url: "/trips?truckId=H8133OF",
      subtitle: "Supir: Khoirul",
      status: "Beroperasi",
    },
  ],
  navSecondary: [
    {
      title: "Referensi Tarif Pabrik",
      url: "/rates",
      icon: <RiTable2 className="size-4" />,
    },
    {
      title: "Bantuan & Kontak Operasional",
      url: "#",
      icon: <RiQuestionLine className="size-4" />,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name?: string | null
    email?: string | null
    role?: string | null
  }
  isAdmin?: boolean
}

export function AppSidebar({
  user,
  isAdmin = false,
  ...props
}: AppSidebarProps) {
  const navMainItems = isAdmin
    ? data.navMain
    : data.navMain.filter((item) => item.url === "/profit-sharing")

  const navSecondaryItems = isAdmin
    ? data.navSecondary
    : data.navSecondary.filter((item) => item.url !== "/rates")

  const currentUser = {
    name: user?.name ?? (isAdmin ? "Mas Hafidz" : "Investor"),
    email: user?.email ?? "",
    role: isAdmin ? "Admin" : "Partner",
  }

  const brandHref = isAdmin ? "/dashboard" : "/profit-sharing"

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link href={brandHref} className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <RiTruckLine className="size-4.5" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold tracking-tight">
                      HW TRANS FLEET
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      Hadya Wiran Trans
                    </span>
                  </div>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMainItems} />
        {isAdmin && <NavDocuments items={data.armada} />}
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
