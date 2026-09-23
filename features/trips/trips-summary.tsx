import {
  RiCoinsLine,
  RiGasStationLine,
  RiLineChartLine,
  RiTruckLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import type { TripsSummary as TripsSummaryType } from "@/features/trips/trips.queries"
import { formatCurrency } from "@/lib/utils"

interface TripsSummaryProps {
  summary: TripsSummaryType
}

export function TripsSummary({ summary }: TripsSummaryProps) {
  const profitMargin =
    summary.totalOmset > 0
      ? ((summary.totalProfit / summary.totalOmset) * 100).toFixed(1)
      : "0.0"

  const sanguRatio =
    summary.totalOmset > 0
      ? ((summary.totalSangu / summary.totalOmset) * 100).toFixed(1)
      : "0.0"

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
      {/* Card 1: Total Ritase Jalan */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4.5 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-primary/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25">
                <RiTruckLine className="size-4" />
              </div>
              <span className="truncate text-xs font-semibold text-muted-foreground">
                Total Ritase Jalan
              </span>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary sm:text-xs"
            >
              Surat Jalan
            </Badge>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
              {summary.totalTrips.toLocaleString("id-ID")}{" "}
              <span className="text-base font-semibold text-muted-foreground">
                Rit
              </span>
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-0.5 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <span className="truncate">Ritase tercatat di sistem</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Armada W 8187 UA & H 8133 OF
          </p>
        </div>
      </div>

      {/* Card 2: Total Omset Bruto */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4.5 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-blue-500/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/25 dark:text-blue-400">
                <RiCoinsLine className="size-4" />
              </div>
              <span className="truncate text-xs font-semibold text-muted-foreground">
                Total Omset Bruto
              </span>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 sm:text-xs dark:text-blue-400"
            >
              Tagihan Pabrik
            </Badge>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
              {formatCurrency(summary.totalOmset)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-0.5 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            <span className="truncate">Pendapatan kotor sebelum potongan</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Berdasarkan tonase & tarif master rute
          </p>
        </div>
      </div>

      {/* Card 3: Sangu Supir & Solar */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4.5 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-amber-500/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/25 dark:text-amber-400">
                <RiGasStationLine className="size-4" />
              </div>
              <span className="truncate text-xs font-semibold text-muted-foreground">
                Sangu Supir & Solar
              </span>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 sm:text-xs dark:text-amber-400"
            >
              {sanguRatio}% Rasio
            </Badge>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
              {formatCurrency(summary.totalSangu)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-0.5 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="truncate">Pengeluaran operasional langsung</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Termasuk solar jatah & sangu jalan riil
          </p>
        </div>
      </div>

      {/* Card 4: Laba Ritase Bersih */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4.5 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-emerald-500/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400">
                <RiLineChartLine className="size-4" />
              </div>
              <span className="truncate text-xs font-semibold text-muted-foreground">
                Laba Ritase Bersih
              </span>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 sm:text-xs dark:text-emerald-400"
            >
              {profitMargin}% Margin
            </Badge>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums sm:text-3xl dark:text-emerald-400">
              {formatCurrency(summary.totalProfit)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-0.5 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="truncate">Laba kotor operasional armada</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Sebelum beban servis bengkel bulanan
          </p>
        </div>
      </div>
    </div>
  )
}
