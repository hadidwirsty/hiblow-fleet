"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { RiAddLine, RiTruckLine } from "@remixicon/react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const ROUTE_NAMES: Record<string, string> = {
  dashboard: "Dashboard",
  trips: "Manajemen Ritase",
  new: "Tambah Ritase",
  expenses: "Pengeluaran Truk",
  "profit-sharing": "Bagi Hasil Pemodal",
  rates: "Referensi Tarif",
  trucks: "Monitoring Armada",
}

export function SiteHeader() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  return (
    <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center justify-between border-b border-sidebar-border bg-background/95 px-4 backdrop-blur transition-[width,height] ease-linear">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink
                render={<Link href="/dashboard">HW Trans</Link>}
              />
            </BreadcrumbItem>
            {segments.length > 0 && (
              <BreadcrumbSeparator className="hidden md:block" />
            )}
            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1
              const href = `/${segments.slice(0, index + 1).join("/")}`
              const label = ROUTE_NAMES[segment] ?? segment

              return (
                <BreadcrumbItem key={href}>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <>
                      <BreadcrumbLink
                        render={<Link href={href}>{label}</Link>}
                      />
                      <BreadcrumbSeparator />
                    </>
                  )}
                </BreadcrumbItem>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 sm:flex dark:text-emerald-400">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
          <span>2 Armada Aktif</span>
        </div>
        <Link
          href="/trips"
          className={buttonVariants({
            size: "sm",
            className: "h-8 gap-1 text-xs shadow-xs",
          })}
        >
          <RiAddLine className="size-3.5" />
          <span className="hidden sm:inline">Order Ritase</span>
        </Link>
      </div>
    </header>
  )
}
