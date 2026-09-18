import { RiCalendarLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import {
  getRateReferences,
  getTripsSummary,
  listTrips,
} from "@/features/trips/trips.queries"
import { TripFormDialog } from "@/features/trips/trip-form-dialog"
import { TripsSummary } from "@/features/trips/trips-summary"
import { TripsTable } from "@/features/trips/trips-table"

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
      {/* Page Title & Action Controls Bar */}
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Pencatatan Ritase
            </h1>
            <span className="hidden items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline-flex">
              <RiCalendarLine className="size-3" />
              Juni 2026
            </span>
            <Badge variant="outline" className="text-xs font-normal">
              {tripsData.length} Surat Jalan
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Rekapitulasi surat jalan semen curah hi-blow, tagihan omset, sangu
            supir, dan laba operasional
          </p>
        </div>

        {/* Modal Dialog Form Tambah Ritase Baru */}
        <div className="flex w-full items-center gap-2.5 sm:w-auto">
          <TripFormDialog rateReferences={rateRefs} />
        </div>
      </div>

      {/* KPI Summary Cards */}
      <TripsSummary summary={summary} />

      {/* Interactive Trips Table */}
      <div className="px-4 lg:px-6">
        <TripsTable trips={tripsData} initialFilter={filter} />
      </div>
    </div>
  )
}
