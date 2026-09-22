"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface NavMainItem {
  title: string
  url: string
  icon?: ReactNode
  isActive?: boolean
  badge?: string
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs tracking-wider text-muted-foreground uppercase">
        Menu Utama
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            item.isActive ??
            (pathname === item.url ||
              (item.url !== "/dashboard" && pathname.startsWith(item.url)))

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={item.title}
                render={
                  <Link href={item.url} className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                }
              />
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
