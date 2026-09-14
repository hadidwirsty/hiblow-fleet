import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiCheckLine,
  RiGasStationLine,
  RiMoneyDollarCircleLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    <div className="grid grid-cols-2 gap-2.5 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4 lg:px-6">
      {/* Card 1: Omset Ritase */}
      <Card className="flex h-full flex-col justify-between border-border bg-card/60 p-3 shadow-xs backdrop-blur-xs transition-all hover:border-primary/50 sm:p-6">
        <CardHeader className="p-0 pb-2">
          <CardDescription className="text-[11px] font-medium text-muted-foreground sm:text-xs">
            Omset Ritase Berjalan
          </CardDescription>
          <CardTitle className="text-base font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
            {formatCurrency(kpis.totalOmset)}
          </CardTitle>
          <CardAction>
            {kpis.previousOmset > 0 ? (
              <Badge
                variant="outline"
                className={`gap-1 text-[10px] font-medium sm:text-xs ${
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
                className="border-muted bg-muted/50 text-[10px] font-medium text-muted-foreground sm:text-xs"
              >
                Bulan baru
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 p-0 pt-1 text-[10px] sm:pt-2 sm:text-xs">
          <div
            className={`flex items-center gap-1.5 font-medium ${
              kpis.previousOmset === 0
                ? "text-muted-foreground"
                : isOmsetUp
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
            }`}
          >
            <span className="line-clamp-1">
              {kpis.previousOmset === 0
                ? "Periode bulan pertama tercatat"
                : `Tren ${isOmsetUp ? "naik" : "turun"} dibanding bulan lalu`}
            </span>
            {kpis.previousOmset > 0 &&
              (isOmsetUp ? (
                <RiArrowUpLine className="size-3 shrink-0 sm:size-3.5" />
              ) : (
                <RiArrowDownLine className="size-3 shrink-0 sm:size-3.5" />
              ))}
          </div>
          <div className="line-clamp-1 text-muted-foreground">
            Akumulasi ritase PT Semen Indonesia & SBI
          </div>
        </CardFooter>
      </Card>

      {/* Card 2: Ritase Selesai */}
      <Card className="flex h-full flex-col justify-between border-border bg-card/60 p-3 shadow-xs backdrop-blur-xs transition-all hover:border-primary/50 sm:p-6">
        <CardHeader className="p-0 pb-2">
          <CardDescription className="text-[11px] font-medium text-muted-foreground sm:text-xs">
            Ritase Selesai
          </CardDescription>
          <CardTitle className="text-base font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
            {kpis.totalTrips} Rit
          </CardTitle>
          <CardAction>
            {kpis.previousTrips > 0 ? (
              <Badge
                variant="outline"
                className="gap-1 border-blue-500/30 bg-blue-500/10 text-[10px] font-medium text-blue-600 sm:text-xs dark:text-blue-400"
              >
                <RiCheckLine className="size-3" />
                {tripDiff >= 0 ? `+${tripDiff} rit` : `${tripDiff} rit`}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-muted bg-muted/50 text-[10px] font-medium text-muted-foreground sm:text-xs"
              >
                Bulan baru
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 p-0 pt-1 text-[10px] sm:pt-2 sm:text-xs">
          <div className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
            <span className="line-clamp-1">
              Target 50 rit/bln ({targetPct}%)
            </span>
          </div>
          <div className="line-clamp-1 text-muted-foreground">
            W 8187 UA ({wRit} rit) & H 8133 OF ({hRit} rit)
          </div>
        </CardFooter>
      </Card>

      {/* Card 3: Sangu Supir & Solar */}
      <Card className="flex h-full flex-col justify-between border-border bg-card/60 p-3 shadow-xs backdrop-blur-xs transition-all hover:border-primary/50 sm:p-6">
        <CardHeader className="p-0 pb-2">
          <CardDescription className="text-[11px] font-medium text-muted-foreground sm:text-xs">
            Sangu Supir & Solar
          </CardDescription>
          <CardTitle className="text-base font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
            {formatCurrency(kpis.totalSangu)}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 border-amber-500/30 bg-amber-500/10 text-[10px] font-medium text-amber-600 sm:text-xs dark:text-amber-400"
            >
              <RiGasStationLine className="size-3" />
              {sanguRatio.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 p-0 pt-1 text-[10px] sm:pt-2 sm:text-xs">
          <div className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
            <span className="line-clamp-1">Rasio operasional aman</span>
          </div>
          <div className="line-clamp-1 text-muted-foreground">
            Total biaya jalan langsung supir & solar
          </div>
        </CardFooter>
      </Card>

      {/* Card 4: Estimasi Laba Bersih */}
      <Card className="flex h-full flex-col justify-between border-border bg-card/60 p-3 shadow-xs backdrop-blur-xs transition-all hover:border-primary/50 sm:p-6">
        <CardHeader className="p-0 pb-2">
          <CardDescription className="text-[11px] font-medium text-muted-foreground sm:text-xs">
            Estimasi Laba Berjalan
          </CardDescription>
          <CardTitle className="text-base font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
            {formatCurrency(kpis.estimasiLaba)}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[10px] font-medium text-emerald-600 sm:text-xs dark:text-emerald-400"
            >
              <RiMoneyDollarCircleLine className="size-3" />
              {marginRatio.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 p-0 pt-1 text-[10px] sm:pt-2 sm:text-xs">
          <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
            <span className="line-clamp-1">Margin operasional ritase</span>
          </div>
          <div className="line-clamp-1 text-muted-foreground">
            Siap rekonsiliasi saat tutup buku bulanan
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
