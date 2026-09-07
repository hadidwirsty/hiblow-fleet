import { and, desc, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import { rateReferences, trips } from "@/db/schema"

export interface ListTripsFilter {
  truckId?: string
  month?: number
  year?: number
}

export async function listTrips(filter: ListTripsFilter = {}) {
  const conditions = []

  if (filter.truckId) {
    conditions.push(eq(trips.truckId, filter.truckId))
  }

  if (filter.month && filter.year) {
    conditions.push(
      sql`EXTRACT(MONTH FROM ${trips.unloadingDate}) = ${filter.month}`,
      sql`EXTRACT(YEAR FROM ${trips.unloadingDate}) = ${filter.year}`
    )
  }

  return db
    .select()
    .from(trips)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(trips.orderDate))
}

export async function getRateReferences() {
  return db
    .select()
    .from(rateReferences)
    .where(eq(rateReferences.isActive, true))
    .orderBy(rateReferences.city, rateReferences.destination)
}

export interface TripsSummary {
  totalTrips: number
  totalOmset: number
  totalProfit: number
  totalSangu: number
}

export async function getTripsSummary(
  filter: ListTripsFilter = {}
): Promise<TripsSummary> {
  const conditions = []

  if (filter.truckId) {
    conditions.push(eq(trips.truckId, filter.truckId))
  }

  if (filter.month && filter.year) {
    conditions.push(
      sql`EXTRACT(MONTH FROM ${trips.unloadingDate}) = ${filter.month}`,
      sql`EXTRACT(YEAR FROM ${trips.unloadingDate}) = ${filter.year}`
    )
  }

  const [result] = await db
    .select({
      totalTrips: sql<number>`count(*)::int`,
      totalOmset: sql<number>`coalesce(sum(${trips.omset}::numeric), 0)::float`,
      totalProfit: sql<number>`coalesce(sum(${trips.profit}::numeric), 0)::float`,
      totalSangu: sql<number>`coalesce(sum(${trips.sangu}::numeric), 0)::float`,
    })
    .from(trips)
    .where(conditions.length > 0 ? and(...conditions) : undefined)

  return (
    result ?? { totalTrips: 0, totalOmset: 0, totalProfit: 0, totalSangu: 0 }
  )
}
