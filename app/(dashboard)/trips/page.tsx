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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      {/* Header Section with Dialog Trigger */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Pencatatan Ritase
            </h1>
            <Badge variant="secondary" className="text-xs font-normal">
              {tripsData.length} Surat Jalan
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Rekapitulasi surat jalan, omset, sangu supir (maks 31 ton), dan laba
            per ritase
          </p>
        </div>

        {/* Modal Dialog Form Input Ritase */}
        <div className="flex items-center gap-2">
          <TripFormDialog rateReferences={rateRefs} />
        </div>
      </div>

      {/* KPI Summary Cards */}
      <TripsSummary summary={summary} />

      {/* Interactive Trips Table with URL-based Filtering & Pagination */}
      <TripsTable trips={tripsData} initialFilter={filter} />
    </div>
  )
}
