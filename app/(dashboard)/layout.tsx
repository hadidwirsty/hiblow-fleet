import { AppSidebar } from "@/components/app-shell/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur transition-[width,height] ease-linear">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span>HW Trans</span>
            <span>/</span>
            <span className="text-foreground">Operasional Armada</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-muted/20">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
