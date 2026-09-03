import { RiCoinsLine, RiLineChartLine, RiTruckLine } from "@remixicon/react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

import type { TripsSummary as TripsSummaryType } from "./trips.queries"

interface TripsSummaryProps {
  summary: TripsSummaryType
}

export function TripsSummary({ summary }: TripsSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* 1. Total Ritase */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Ritase
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <RiTruckLine className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            {summary.totalTrips.toLocaleString("id-ID")}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              rit
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Jumlah pengiriman semen curah
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Omset */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Omset
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <RiCoinsLine className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {formatCurrency(summary.totalOmset)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Pendapatan bruto tagihan pabrik
          </p>
        </CardContent>
      </Card>

      {/* 3. Total Laba Bersih */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Laba Ritase (Gross Profit)
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <RiLineChartLine className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totalProfit)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Setelah dikurangi sangu supir & potongan
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
