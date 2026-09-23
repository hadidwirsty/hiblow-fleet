import type { Metadata } from "next"
import { RiTruckLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import {
  getRateReferences,
  getTripsSummary,
  listTrips,
} from "@/features/trips/trips.queries"
import { TripFormDialog } from "@/features/trips/trip-form-dialog"
import { TripsExportButton } from "@/features/trips/trips-export-button"
import { TripsSummary } from "@/features/trips/trips-summary"
import { TripsTable } from "@/features/trips/trips-table"

export const metadata: Metadata = {
  title: "Pencatatan Ritase — HW Trans Fleet",
  description:
    "Rekapitulasi surat jalan semen curah hi-blow, tagihan omset, sangu supir, dan laba operasional armada HW Trans",
}

export const dynamic = "force-dynamic"

interface TripsPageProps {
  searchParams: Promise<{
    truckId?: string
    month?: string
    year?: string
  }>
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const params = await searchParams

  const truckId =
    params.truckId === "W8187UA" || params.truckId === "H8133OF"
      ? params.truckId
      : undefined

  const month = params.month ? parseInt(params.month, 10) : undefined
  const year = params.year ? parseInt(params.year, 10) : undefined

  const filter = {
    truckId,
    month: month && month >= 1 && month <= 12 ? month : undefined,
    year: year && year >= 2024 ? year : undefined,
  }

  const [tripsData, summary, rateRefs] = await Promise.all([
    listTrips(filter),
    getTripsSummary(filter),
    getRateReferences(),
  ])

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RiTruckLine className="size-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Pencatatan Ritase
            </h1>
            <Badge variant="outline" className="text-xs font-normal">
              {tripsData.length} Surat Jalan
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Rekapitulasi surat jalan semen curah hi-blow, tagihan omset, sangu
            supir, dan laba operasional
          </p>
        </div>

        {/* Action Controls Group: Ekspor & Tambah Ritase */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2.5">
          <TripFormDialog rateReferences={rateRefs} />
          <TripsExportButton trips={tripsData} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6 px-4 lg:px-6">
        {/* KPI Metric Cards */}
        <TripsSummary summary={summary} />

        {/* Trips Data Table Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Daftar Surat Jalan & Ritase
              </h2>
              <p className="text-xs text-muted-foreground">
                Gunakan pencarian untuk menyaring nomor surat jalan, kota, atau
                nama tujuan bongkar
              </p>
            </div>
          </div>

          <TripsTable
            trips={tripsData}
            rateReferences={rateRefs}
            initialFilter={filter}
          />
        </div>
      </div>
    </div>
  )
}
