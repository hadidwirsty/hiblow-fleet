"use client"

import { Suspense, useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { GlobalLoadingOverlay } from "@/components/layout/global-loading-overlay"

function DashboardNavigationLoadingContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 50)
    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a")
      if (!target) return

      const href = target.getAttribute("href")
      if (
        !href ||
        href === "#" ||
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        target.hasAttribute("download")
      ) {
        return
      }

      if (
        href.startsWith("/") &&
        !href.startsWith("//") &&
        target.target !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        try {
          const url = new URL(href, window.location.origin)
          if (url.pathname !== pathname) {
            setIsLoading(true)
          }
        } catch {}
      }
    }

    document.addEventListener("click", handleClick, { capture: true })
    return () => {
      document.removeEventListener("click", handleClick, { capture: true })
    }
  }, [pathname])

  useEffect(() => {
    if (!isLoading) return
    const safetyTimer = setTimeout(() => {
      setIsLoading(false)
    }, 3500)
    return () => clearTimeout(safetyTimer)
  }, [isLoading])

  const shouldShow = isInitialLoad || isLoading

  return (
    <GlobalLoadingOverlay
      open={shouldShow}
      label="HW Trans Fleet"
      description="Memuat data operasional armada & keuangan..."
    />
  )
}

export function DashboardNavigationLoading() {
  return (
    <Suspense fallback={null}>
      <DashboardNavigationLoadingContent />
    </Suspense>
  )
}
