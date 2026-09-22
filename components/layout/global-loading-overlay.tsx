"use client"

import { useEffect, useState } from "react"

import { TruckSpinner } from "@/components/ui/truck-spinner"
import { cn } from "@/lib/utils"

export interface GlobalLoadingOverlayProps {
  open: boolean
  label?: string
  description?: string
  className?: string
}

export function GlobalLoadingOverlay({
  open,
  label = "HW Trans Fleet",
  description = "Memuat data operasional armada & keuangan...",
  className,
}: GlobalLoadingOverlayProps) {
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true)
    } else {
      const timer = setTimeout(() => setMounted(false), 150)
      return () => clearTimeout(timer)
    }
  }, [open])

  if (!mounted) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-150 select-none",
        open ? "opacity-100" : "pointer-events-none opacity-0",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl transition-all duration-150 sm:min-w-80",
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        <TruckSpinner size="xl" label={label} description={description} />
      </div>
    </div>
  )
}
