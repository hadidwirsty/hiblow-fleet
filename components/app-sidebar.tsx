"use client"

import * as React from "react"
import Image from "next/image"
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
    name: "Muhammad Hafidz Wirandryo",
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
    name: user?.name ?? (isAdmin ? "Muhammad Hafidz Wirandryo" : "Investor"),
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
              className="group/brand h-auto rounded-xl px-2 py-1.5 transition-colors hover:bg-sidebar-accent/50"
              render={
                <Link
                  href={brandHref}
                  className="flex w-full items-center gap-3"
                >
                  <div className="relative flex size-12 shrink-0 items-center justify-center transition-transform duration-200 group-hover/brand:scale-105">
                    <Image
                      src="/images/logo_dark.png"
                      alt="Logo Hadya Wiran Trans"
                      width={52}
                      height={52}
                      priority
                      className="hidden size-full object-contain dark:block"
                    />
                    <Image
                      src="/images/logo_light.png"
                      alt="Logo Hadya Wiran Trans"
                      width={52}
                      height={52}
                      priority
                      className="block size-full object-contain dark:hidden"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-extrabold tracking-tight text-foreground">
                        HW TRANS
                      </span>
                      <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-600 uppercase ring-1 ring-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-400/30">
                        Fleet
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="truncate font-medium">
                        Hadya Wiran Trans
                      </span>
                      <span className="size-1 shrink-0 rounded-full bg-emerald-500" />
                    </div>
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
