import type { Metadata } from "next"
import { RiTable2 } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import {
  getDistinctClients,
  getDistinctOriginPlants,
  getRateReferencesSummary,
  listRateReferences,
} from "@/features/rates/rates.queries"
import { RateFormDialog } from "@/features/rates/rate-form-dialog"
import { RatesExportButton } from "@/features/rates/rates-export-button"
import { RatesSummary } from "@/features/rates/rates-summary"
import { RatesTable } from "@/features/rates/rates-table"

export const metadata: Metadata = {
  title: "Referensi Tarif Pabrik",
  description:
    "Master acuan tarif per ton dan nominal sangu supir untuk rute pabrik semen curah HW Trans",
}

export const dynamic = "force-dynamic"

export default async function RatesPage() {
  const [rates, summary, distinctClients, distinctOriginPlants] =
    await Promise.all([
      listRateReferences(),
      getRateReferencesSummary(),
      getDistinctClients(),
      getDistinctOriginPlants(),
    ])

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RiTable2 className="size-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Referensi Tarif Pabrik
            </h1>
            <Badge variant="outline" className="text-xs font-normal">
              {summary.totalRoutes} Rute
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Master data acuan tarif per ton dan persentase sangu supir untuk
            rute pengiriman semen curah HW Trans
          </p>
        </div>

        {/* Action Controls Group: Ekspor & Tambah Tarif */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2.5">
          <RateFormDialog distinctOriginPlants={distinctOriginPlants} />
          <RatesExportButton rates={rates} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full min-w-0 space-y-6 px-4 lg:px-6">
        {/* KPI Metric Cards */}
        <RatesSummary summary={summary} />

        {/* Rates Data Table */}
        <div className="w-full min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Daftar Rute & Tarif
              </h2>
              <p className="text-xs text-muted-foreground">
                Gunakan pencarian untuk menyaring kota tujuan atau tujuan
                bongkar
              </p>
            </div>
          </div>

          <RatesTable
            rates={rates}
            distinctClients={distinctClients}
            distinctOriginPlants={distinctOriginPlants}
          />
        </div>
      </div>
    </div>
  )
}
