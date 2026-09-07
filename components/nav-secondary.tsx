"use client"

import Link from "next/link"
import type { ReactNode } from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface NavSecondaryItem {
  title: string
  url: string
  icon: ReactNode
}

export function NavSecondary({
  items,
  className,
  ...props
}: {
  items: NavSecondaryItem[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup className={className} {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                size="sm"
                tooltip={item.title}
                render={
                  <Link href={item.url} className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                }
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
