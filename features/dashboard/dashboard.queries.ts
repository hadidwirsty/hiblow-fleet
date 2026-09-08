import { and, desc, ne, sql } from "drizzle-orm"

import { db } from "@/db"
import { expenses, trips } from "@/db/schema"
import type { Trip } from "@/db/schema"

export interface DashboardKPIs {
  totalOmset: number
  totalTrips: number
  totalSangu: number
  totalExpenses: number
  estimasiLaba: number
  previousOmset: number
  previousTrips: number
}

export interface TruckBreakdown {
  truckId: string
  totalTrips: number
  totalOmset: number
  totalSangu: number
}

export interface ChartDataPoint {
  date: string
  w8187ua: number
  h8133of: number
}

export type RecentTripRow = Pick<
  Trip,
  | "id"
  | "truckId"
  | "orderNumber"
  | "orderDate"
  | "unloadingDate"
  | "destinationCity"
  | "destinationName"
  | "unloadedTonnage"
  | "omset"
  | "sangu"
>

export async function getDashboardKPIs(
  month: number,
  year: number
): Promise<DashboardKPIs> {
  const [tripResult] = await db
    .select({
      totalOmset: sql<number>`coalesce(sum(${trips.omset}::numeric), 0)::float`,
      totalTrips: sql<number>`count(*)::int`,
      totalSangu: sql<number>`coalesce(sum(${trips.sangu}::numeric), 0)::float`,
    })
    .from(trips)
    .where(
      and(
        sql`EXTRACT(MONTH FROM ${trips.unloadingDate}) = ${month}`,
        sql`EXTRACT(YEAR FROM ${trips.unloadingDate}) = ${year}`
      )
    )

  const [expenseResult] = await db
    .select({
      totalExpenses: sql<number>`coalesce(sum(${expenses.amount}::numeric + ${expenses.adminFee}::numeric), 0)::float`,
    })
    .from(expenses)
    .where(
      and(
        sql`EXTRACT(MONTH FROM ${expenses.expenseDate}) = ${month}`,
        sql`EXTRACT(YEAR FROM ${expenses.expenseDate}) = ${year}`,
        ne(expenses.category, "DP/Cicilan")
      )
    )

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year

  const [prevResult] = await db
    .select({
      totalOmset: sql<number>`coalesce(sum(${trips.omset}::numeric), 0)::float`,
      totalTrips: sql<number>`count(*)::int`,
    })
    .from(trips)
    .where(
      and(
        sql`EXTRACT(MONTH FROM ${trips.unloadingDate}) = ${prevMonth}`,
        sql`EXTRACT(YEAR FROM ${trips.unloadingDate}) = ${prevYear}`
      )
    )

  const totalOmset = tripResult?.totalOmset ?? 0
  const totalTrips = tripResult?.totalTrips ?? 0
  const totalSangu = tripResult?.totalSangu ?? 0
  const totalExpenses = expenseResult?.totalExpenses ?? 0

  return {
    totalOmset,
    totalTrips,
    totalSangu,
    totalExpenses,
    estimasiLaba: totalOmset - totalSangu - totalExpenses,
    previousOmset: prevResult?.totalOmset ?? 0,
    previousTrips: prevResult?.totalTrips ?? 0,
  }
}

export async function getTruckBreakdown(
  month: number,
  year: number
): Promise<TruckBreakdown[]> {
  return db
    .select({
      truckId: trips.truckId,
      totalTrips: sql<number>`count(*)::int`,
      totalOmset: sql<number>`coalesce(sum(${trips.omset}::numeric), 0)::float`,
      totalSangu: sql<number>`coalesce(sum(${trips.sangu}::numeric), 0)::float`,
    })
    .from(trips)
    .where(
      and(
        sql`EXTRACT(MONTH FROM ${trips.unloadingDate}) = ${month}`,
        sql`EXTRACT(YEAR FROM ${trips.unloadingDate}) = ${year}`
      )
    )
    .groupBy(trips.truckId)
}

export async function getDailyTripChart(
  month: number,
  year: number
): Promise<ChartDataPoint[]> {
  const pad = (n: number) => String(n).padStart(2, "0")
  const lastDay = new Date(year, month, 0).getDate()
  const startDate = `${year}-${pad(month)}-01`
  const endDate = `${year}-${pad(month)}-${pad(lastDay)}`

  const result = (await db.execute(sql`
    SELECT
      to_char(d.day, 'YYYY-MM-DD') AS date,
      COALESCE(SUM(CASE WHEN t.truck_id = 'W8187UA' THEN 1 ELSE 0 END), 0)::int AS w8187ua,
      COALESCE(SUM(CASE WHEN t.truck_id = 'H8133OF' THEN 1 ELSE 0 END), 0)::int AS h8133of
    FROM generate_series(
      ${startDate}::date,
      ${endDate}::date,
      '1 day'::interval
    ) AS d(day)
    LEFT JOIN trips t ON t.unloading_date = d.day::date
    GROUP BY d.day
    ORDER BY d.day ASC
  `)) as unknown as { rows: ChartDataPoint[] }

  return result.rows ?? []
}

export async function getRecentTrips(
  limitCount = 10
): Promise<RecentTripRow[]> {
  return db
    .select({
      id: trips.id,
      truckId: trips.truckId,
      orderNumber: trips.orderNumber,
      orderDate: trips.orderDate,
      unloadingDate: trips.unloadingDate,
      destinationCity: trips.destinationCity,
      destinationName: trips.destinationName,
      unloadedTonnage: trips.unloadedTonnage,
      omset: trips.omset,
      sangu: trips.sangu,
    })
    .from(trips)
    .orderBy(desc(trips.orderDate), desc(trips.orderNumber))
    .limit(limitCount)
}
