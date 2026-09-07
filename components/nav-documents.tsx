"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { RiTruckLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface NavDocumentItem {
  name: string
  url: string
  icon?: ReactNode
  subtitle?: string
  status?: string
}

export function NavDocuments({ items }: { items: NavDocumentItem[] }) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-xs tracking-wider text-muted-foreground uppercase">
        Unit Armada Aktif
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              render={
                <Link
                  href={item.url}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon ?? (
                      <RiTruckLine className="size-4 text-primary" />
                    )}
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-semibold">
                        {item.name}
                      </span>
                      {item.subtitle && (
                        <span className="text-[10px] text-muted-foreground">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.status && (
                    <Badge
                      variant="outline"
                      className="px-1.5 py-0 text-[10px] font-normal"
                    >
                      {item.status}
                    </Badge>
                  )}
                </Link>
              }
            />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
