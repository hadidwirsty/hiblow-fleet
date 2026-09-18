import {
  RiCheckLine,
  RiCoinsLine,
  RiPercentLine,
  RiRouteLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import type { RateReferencesSummary } from "@/features/rates/rates.queries"
import { formatCurrency } from "@/lib/utils"

interface RatesSummaryProps {
  summary: RateReferencesSummary
}

export function RatesSummary({ summary }: RatesSummaryProps) {
  const activePercent =
    summary.totalRoutes > 0
      ? Math.round((summary.activeRoutes / summary.totalRoutes) * 100)
      : 0

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
      {/* Card 1: Total Rute Terdaftar */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4.5 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-primary/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25">
                <RiRouteLine className="size-4" />
              </div>
              <span className="truncate text-xs font-semibold text-muted-foreground">
                Total Rute Terdaftar
              </span>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary sm:text-xs"
            >
              {summary.uniqueClients} Pabrik Klien
            </Badge>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
              {summary.totalRoutes.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-0.5 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <span className="truncate">Katalog Rute Master</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            {summary.uniqueClients} pabrik klien semen curah
          </p>
        </div>
      </div>

      {/* Card 2: Rute Aktif Beroperasi */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4.5 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-emerald-500/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400">
                <RiCheckLine className="size-4" />
              </div>
              <span className="truncate text-xs font-semibold text-muted-foreground">
                Rute Aktif Beroperasi
              </span>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 sm:text-xs dark:text-emerald-400"
            >
              {activePercent}% Aktif
            </Badge>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums sm:text-3xl dark:text-emerald-400">
              {summary.activeRoutes.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-0.5 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="truncate">Siap Penugasan Armada</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            {summary.totalRoutes - summary.activeRoutes} rute dinonaktifkan
          </p>
        </div>
      </div>

      {/* Card 3: Rata-rata Tarif / Ton */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4.5 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-amber-500/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/25 dark:text-amber-400">
                <RiCoinsLine className="size-4" />
              </div>
              <span className="truncate text-xs font-semibold text-muted-foreground">
                Rata-rata Tarif / Ton
              </span>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 sm:text-xs dark:text-amber-400"
            >
              Acuan Standar
            </Badge>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
              {formatCurrency(summary.avgRatePerTon)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-0.5 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="truncate">Tarif Dasar Resmi</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Acuan tonase standar 31 ton
          </p>
        </div>
      </div>

      {/* Card 4: Potongan Khusus (LJU) */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4.5 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-purple-500/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 ring-1 ring-purple-500/25 dark:text-purple-400">
                <RiPercentLine className="size-4" />
              </div>
              <span className="truncate text-xs font-semibold text-muted-foreground">
                Potongan Khusus (LJU)
              </span>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-600 sm:text-xs dark:text-purple-400"
            >
              Grobogan / LJU
            </Badge>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-purple-600 tabular-nums sm:text-3xl dark:text-purple-400">
              {summary.specialDeductionRoutes.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-0.5 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400">
            <span className="truncate">Ketentuan Potongan Rute</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Pajak 1%, Potongan 2% LJU, 5% UJ
          </p>
        </div>
      </div>
    </div>
  )
}
