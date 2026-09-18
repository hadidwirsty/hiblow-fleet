import { redirect } from "next/navigation"
import type { CSSProperties, ReactNode } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { DashboardNavigationLoading } from "@/components/dashboard-navigation-loading"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { isAdmin } from "@/lib/rbac"
import { getCurrentSession } from "@/lib/session"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getCurrentSession()

  if (!session?.user) {
    redirect("/login")
  }

  const user = session.user
  const userIsAdmin = isAdmin(user)

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <DashboardNavigationLoading />
      <AppSidebar variant="inset" user={user} isAdmin={userIsAdmin} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
