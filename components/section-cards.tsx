import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiCheckLine,
  RiGasStationLine,
  RiLineChartLine,
  RiMoneyDollarCircleLine,
  RiTruckLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import type {
  DashboardKPIs,
  TruckBreakdown,
} from "@/features/dashboard/dashboard.queries"

export interface SectionCardsProps {
  kpis: DashboardKPIs
  truckBreakdown: TruckBreakdown[]
}

export function SectionCards({ kpis, truckBreakdown }: SectionCardsProps) {
  // Omset calculation
  const omsetDiff = kpis.totalOmset - kpis.previousOmset
  const omsetPct =
    kpis.previousOmset > 0 ? (omsetDiff / kpis.previousOmset) * 100 : 0
  const isOmsetUp = omsetPct >= 0

  // Trips calculation
  const tripDiff = kpis.totalTrips - kpis.previousTrips
  const wRit =
    truckBreakdown.find((t) => t.truckId === "W8187UA")?.totalTrips ?? 0
  const hRit =
    truckBreakdown.find((t) => t.truckId === "H8133OF")?.totalTrips ?? 0
  const targetPct = Math.round((kpis.totalTrips / 50) * 100)

  // Sangu & Margin ratios
  const sanguRatio =
    kpis.totalOmset > 0 ? (kpis.totalSangu / kpis.totalOmset) * 100 : 0
  const marginRatio =
    kpis.totalOmset > 0 ? (kpis.estimasiLaba / kpis.totalOmset) * 100 : 0

  return (
    <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4 xl:px-6">
      {/* Card 1: Omset Ritase Berjalan */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4.5 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-emerald-500/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400">
                <RiMoneyDollarCircleLine className="size-4" />
              </div>
              <span className="truncate text-xs font-semibold text-muted-foreground">
                Omset Ritase Berjalan
              </span>
            </div>
            {kpis.previousOmset > 0 ? (
              <Badge
                variant="outline"
                className={`shrink-0 gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${
                  isOmsetUp
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                {isOmsetUp ? (
                  <RiArrowUpLine className="size-3" />
                ) : (
                  <RiArrowDownLine className="size-3" />
                )}
                {isOmsetUp
                  ? `+${omsetPct.toFixed(1)}%`
                  : `${omsetPct.toFixed(1)}%`}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="shrink-0 rounded-full border-muted bg-muted/50 text-[10px] font-medium text-muted-foreground"
              >
                Bulan baru
              </Badge>
            )}
          </div>

          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
              {formatCurrency(kpis.totalOmset)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-0.5 border-t border-border/50 pt-3">
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${
              kpis.previousOmset === 0
                ? "text-muted-foreground"
                : isOmsetUp
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
            }`}
          >
            <span className="truncate">
              {kpis.previousOmset === 0
                ? "Periode bulan pertama tercatat"
                : `Tren ${isOmsetUp ? "naik" : "turun"} dibanding bulan lalu`}
            </span>
            {kpis.previousOmset > 0 &&
              (isOmsetUp ? (
                <RiArrowUpLine className="size-3 shrink-0" />
              ) : (
                <RiArrowDownLine className="size-3 shrink-0" />
              ))}
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Akumulasi ritase PT Semen Indonesia & SBI
          </p>
        </div>
      </div>

      {/* Card 2: Ritase Selesai */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4.5 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-blue-500/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/25 dark:text-blue-400">
                <RiTruckLine className="size-4" />
              </div>
              <span className="truncate text-xs font-semibold text-muted-foreground">
                Ritase Selesai
              </span>
            </div>
            {kpis.previousTrips > 0 ? (
              <Badge
                variant="outline"
                className="shrink-0 gap-0.5 rounded-full border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 sm:text-xs dark:text-blue-400"
              >
                <RiCheckLine className="size-3" />
                {tripDiff >= 0 ? `+${tripDiff} rit` : `${tripDiff} rit`}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="shrink-0 rounded-full border-muted bg-muted/50 text-[10px] font-medium text-muted-foreground"
              >
                Bulan baru
              </Badge>
            )}
          </div>

          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
              {kpis.totalTrips} Rit
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-0.5 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            <span className="truncate">Target 50 rit/bln ({targetPct}%)</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            W 8187 UA ({wRit} rit) & H 8133 OF ({hRit} rit)
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
              {sanguRatio.toFixed(1)}%
            </Badge>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
              {formatCurrency(kpis.totalSangu)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-0.5 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="truncate">Rasio operasional aman</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Total biaya jalan langsung supir & solar
          </p>
        </div>
      </div>

      {/* Card 4: Estimasi Laba Berjalan */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4.5 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-emerald-500/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400">
                <RiLineChartLine className="size-4" />
              </div>
              <span className="truncate text-xs font-semibold text-muted-foreground">
                Estimasi Laba Berjalan
              </span>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 sm:text-xs dark:text-emerald-400"
            >
              {marginRatio.toFixed(1)}%
            </Badge>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
              {formatCurrency(kpis.estimasiLaba)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-0.5 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="truncate">Margin operasional ritase</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Siap rekonsiliasi saat tutup buku bulanan
          </p>
        </div>
      </div>
    </div>
  )
}
