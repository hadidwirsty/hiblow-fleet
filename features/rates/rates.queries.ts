import { and, asc, eq, ilike, or, sql } from "drizzle-orm"

import { db } from "@/db"
import { rateReferences } from "@/db/schema"
import type { RateReference } from "@/db/schema"

export interface ListRateReferencesFilter {
  search?: string
  originPlant?: string
  clientName?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

export interface RateReferencesSummary {
  totalRoutes: number
  activeRoutes: number
  uniqueClients: number
  avgRatePerTon: number
  specialDeductionRoutes: number
}

export async function listRateReferences(
  filter: ListRateReferencesFilter = {}
): Promise<RateReference[]> {
  const conditions = []

  if (filter.search && filter.search.trim()) {
    const term = `%${filter.search.trim()}%`
    conditions.push(
      or(
        ilike(rateReferences.originPlant, term),
        ilike(rateReferences.city, term),
        ilike(rateReferences.destination, term),
        ilike(rateReferences.clientName, term)
      )
    )
  }

  if (filter.originPlant && filter.originPlant.trim()) {
    conditions.push(eq(rateReferences.originPlant, filter.originPlant.trim()))
  }

  if (filter.clientName && filter.clientName.trim()) {
    conditions.push(eq(rateReferences.clientName, filter.clientName.trim()))
  }

  if (filter.isActive !== undefined) {
    conditions.push(eq(rateReferences.isActive, filter.isActive))
  }

  let query = db
    .select()
    .from(rateReferences)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      asc(rateReferences.originPlant),
      asc(rateReferences.city),
      asc(rateReferences.destination)
    )
    .$dynamic()

  if (filter.limit) {
    query = query.limit(filter.limit)
  }

  if (filter.offset) {
    query = query.offset(filter.offset)
  }

  return await query
}

export async function getRateReferencesSummary(): Promise<RateReferencesSummary> {
  const [result] = await db
    .select({
      totalRoutes: sql<number>`count(*)::int`,
      activeRoutes: sql<number>`count(*) filter (where ${rateReferences.isActive} = true)::int`,
      uniqueClients: sql<number>`count(distinct ${rateReferences.clientName})::int`,
      avgRatePerTon: sql<number>`coalesce(round(avg(${rateReferences.ratePerTon}::numeric), 2), 0)::float`,
      specialDeductionRoutes: sql<number>`count(*) filter (where ${rateReferences.hasSpecialDeductions} = true)::int`,
    })
    .from(rateReferences)

  return (
    result ?? {
      totalRoutes: 0,
      activeRoutes: 0,
      uniqueClients: 0,
      avgRatePerTon: 0,
      specialDeductionRoutes: 0,
    }
  )
}

export async function getDistinctClients(): Promise<string[]> {
  const results = await db
    .selectDistinct({ clientName: rateReferences.clientName })
    .from(rateReferences)
    .orderBy(asc(rateReferences.clientName))

  return results.map((r) => r.clientName)
}

export async function getDistinctOriginPlants(): Promise<string[]> {
  const results = await db
    .selectDistinct({ originPlant: rateReferences.originPlant })
    .from(rateReferences)
    .orderBy(asc(rateReferences.originPlant))

  return results.map((r) => r.originPlant)
}
