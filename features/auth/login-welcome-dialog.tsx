"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { RiCheckboxCircleLine, RiTruckLine } from "@remixicon/react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface LoginWelcomeDialogProps {
  open: boolean
  redirectUrl: string | null
  onOpenChange?: (open: boolean) => void
}

export function LoginWelcomeDialog({
  open,
  redirectUrl,
  onOpenChange,
}: LoginWelcomeDialogProps) {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const isNavigatingRef = useRef(false)

  useEffect(() => {
    if (!open || !redirectUrl) {
      isNavigatingRef.current = false
      return
    }

    // Prefetch halaman tujuan di background selagi animasi berjalan
    try {
      router.prefetch(redirectUrl)
    } catch {
      // Abaikan jika prefetch gagal di lingkungan tertentu
    }

    isNavigatingRef.current = false

    const startTime = Date.now()
    const duration = 1400

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progressPercent = Math.min((elapsed / duration) * 100, 100)

      setProgress(progressPercent)

      if (progressPercent >= 100) {
        clearInterval(interval)

        if (!isNavigatingRef.current) {
          isNavigatingRef.current = true
          // Berpindah halaman terlebih dahulu tanpa menutup modal di halaman login.
          // Modal tetap terbuka menutupi form login hingga halaman tujuan sepenuhnya aktif.
          window.location.replace(redirectUrl)
        }
      }
    }, 20)

    return () => {
      clearInterval(interval)
      setProgress(0)
    }
  }, [open, redirectUrl, router])

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isNavigatingRef.current) return
        onOpenChange?.(nextOpen)
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl sm:max-w-md"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-400">
            <RiCheckboxCircleLine className="size-6" />
          </div>

          <DialogHeader className="space-y-1.5 text-center">
            <DialogTitle className="text-lg font-bold text-foreground sm:text-xl">
              Selamat Datang di HW Trans Fleet
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Otentikasi berhasil. Menyiapkan sistem manajemen operasional
              armada & keuangan...
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 w-full space-y-2.5">
            <div className="relative pt-6">
              <div
                className="pointer-events-none absolute top-0 -translate-x-1/2 transition-all duration-75 ease-linear"
                style={{
                  left: `${Math.min(Math.max(progress, 5), 95)}%`,
                }}
              >
                <div className="animate-truck-rumble flex items-center text-emerald-600 dark:text-emerald-400">
                  <RiTruckLine className="size-6 drop-shadow-md" />
                </div>
              </div>

              <Progress value={progress} className="w-full" />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {progress < 35
                  ? "Memverifikasi hak akses akun..."
                  : progress < 80
                    ? "Menyiapkan armada & rute operasional..."
                    : "Siap! Membuka halaman..."}
              </span>
              <span className="font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
