import {
  RiCheckLine,
  RiCoinsLine,
  RiPercentLine,
  RiRouteLine,
} from "@remixicon/react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RateReferencesSummary } from "@/features/rates/rates.queries"
import { formatCurrency } from "@/lib/utils"

interface RatesSummaryProps {
  summary: RateReferencesSummary
}

export function RatesSummary({ summary }: RatesSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Rute */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Total Rute Terdaftar
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <RiRouteLine className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            {summary.totalRoutes}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.uniqueClients} pabrik klien semen curah
          </p>
        </CardContent>
      </Card>

      {/* Rute Aktif */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Rute Aktif Beroperasi
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
            <RiCheckLine className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {summary.activeRoutes}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.totalRoutes - summary.activeRoutes} rute dinonaktifkan
          </p>
        </CardContent>
      </Card>

      {/* Rata-rata Tarif / Ton */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Rata-rata Tarif / Ton
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
            <RiCoinsLine className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            {formatCurrency(summary.avgRatePerTon)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Acuan tonase standar 31 ton
          </p>
        </CardContent>
      </Card>

      {/* Rute Khusus LJU / Grobogan */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Potongan Khusus (LJU)
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-md bg-purple-500/10 text-purple-600">
            <RiPercentLine className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
            {summary.specialDeductionRoutes}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Pajak 1%, Pot 2% LJU, 5% UJ
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
