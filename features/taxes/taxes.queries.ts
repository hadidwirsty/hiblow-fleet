import { and, desc, eq, inArray, ne, sql } from "drizzle-orm"

import { db } from "@/db"
import { expenses, trips } from "@/db/schema"
import {
  calculateTaxAccounting,
  type TaxAccountingResult,
} from "@/domain/calculators/tax-accounting"

export interface TaxAccountingFilter {
  year: number
  month?: number
  truckId?: string
  includeWithholdingDetails?: boolean
}

export interface WithholdingTripItem {
  id: string
  letterNumber: string
  unloadingDate: string
  factoryName: string
  omset: number
  tax1Pct: number
  taxWithholdingNumber: string | null
  taxWithholdingDate: string | null
}

export interface TaxYoyItem {
  year: number
  totalTrips: number
  totalTonnage: number
  grossOmset: number
  netOmset12Pct: number
  totalExpenses: number
  realOperatingProfit: number
  tax1PctWithholding: number
  bestSchemeTax: number
  bestSchemeName: string
}

export interface TaxAccountingData {
  period: {
    year: number
    month?: number
    truckId?: string
    periodLabel: string
  }
  tripMetrics: {
    totalTrips: number
    totalTonnage: number
    grossOmset: number
    totalSangu: number
    totalIncentive: number
    totalThirdPartyFee: number
    totalDeduction2PctLju: number
    totalTax1PctWithholding: number
  }
  expenseMetrics: {
    totalOpex: number
    categoryBreakdown: { category: string; total: number; count: number }[]
  }
  calculations: TaxAccountingResult
  withholdingTripDetails: WithholdingTripItem[]
}

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

export async function getTaxAccountingData(
  filter: TaxAccountingFilter
): Promise<TaxAccountingData> {
  const { year, month, truckId, includeWithholdingDetails = true } = filter

  // 1. Build trip conditions
  const tripConditions = [
    sql`EXTRACT(YEAR FROM ${trips.unloadingDate}) = ${year}`,
  ]

  if (month !== undefined && month >= 1 && month <= 12) {
    tripConditions.push(
      sql`EXTRACT(MONTH FROM ${trips.unloadingDate}) = ${month}`
    )
  }

  if (truckId) {
    tripConditions.push(eq(trips.truckId, truckId))
  }

  // 2. Query trips aggregations
  const [tripAgg] = await db
    .select({
      totalTrips: sql<number>`count(*)::int`,
      totalTonnage: sql<number>`coalesce(sum(${trips.unloadedTonnage}::numeric), 0)::float`,
      grossOmset: sql<number>`coalesce(sum(${trips.omset}::numeric), 0)::float`,
      totalSangu: sql<number>`coalesce(sum(${trips.sangu}::numeric), 0)::float`,
      totalIncentive: sql<number>`coalesce(sum(${trips.incentivePaid}::numeric), 0)::float`,
      totalThirdPartyFee: sql<number>`coalesce(sum(${trips.thirdPartyFee}::numeric), 0)::float`,
      totalDeduction2PctLju: sql<number>`coalesce(sum(${trips.deduction2PctLju}::numeric), 0)::float`,
      totalTax1Pct: sql<number>`coalesce(sum(${trips.tax1Pct}::numeric), 0)::float`,
    })
    .from(trips)
    .where(and(...tripConditions))

  const tripMetrics = {
    totalTrips: tripAgg?.totalTrips ?? 0,
    totalTonnage: tripAgg?.totalTonnage ?? 0,
    grossOmset: tripAgg?.grossOmset ?? 0,
    totalSangu: tripAgg?.totalSangu ?? 0,
    totalIncentive: tripAgg?.totalIncentive ?? 0,
    totalThirdPartyFee: tripAgg?.totalThirdPartyFee ?? 0,
    totalDeduction2PctLju: tripAgg?.totalDeduction2PctLju ?? 0,
    totalTax1PctWithholding: tripAgg?.totalTax1Pct ?? 0,
  }

  // 3. Build expenses conditions (Excluding DP/Cicilan)
  const expenseConditions = [
    ne(expenses.category, "DP/Cicilan"),
    sql`EXTRACT(YEAR FROM ${expenses.expenseDate}) = ${year}`,
  ]

  if (month !== undefined && month >= 1 && month <= 12) {
    expenseConditions.push(
      sql`EXTRACT(MONTH FROM ${expenses.expenseDate}) = ${month}`
    )
  }

  if (truckId) {
    expenseConditions.push(eq(expenses.truckId, truckId))
  }

  // 4. Query expenses total
  const [expenseAgg] = await db
    .select({
      totalOpex: sql<number>`coalesce(sum(${expenses.amount}::numeric + ${expenses.adminFee}::numeric), 0)::float`,
    })
    .from(expenses)
    .where(and(...expenseConditions))

  // 5. Query expenses breakdown per category
  const categoryBreakdown = await db
    .select({
      category: expenses.category,
      total: sql<number>`coalesce(sum(${expenses.amount}::numeric + ${expenses.adminFee}::numeric), 0)::float`,
      count: sql<number>`count(*)::int`,
    })
    .from(expenses)
    .where(and(...expenseConditions))
    .groupBy(expenses.category)
    .orderBy(
      desc(
        sql`sum(${expenses.amount}::numeric + ${expenses.adminFee}::numeric)`
      )
    )

  const expenseMetrics = {
    totalOpex: expenseAgg?.totalOpex ?? 0,
    categoryBreakdown: categoryBreakdown ?? [],
  }

  // 6. Query trips withholding details (optional optimization)
  let withholdingTripDetails: WithholdingTripItem[] = []

  if (includeWithholdingDetails) {
    const withholdingTrips = await db
      .select({
        id: trips.id,
        orderNumber: trips.orderNumber,
        unloadingDate: trips.unloadingDate,
        destinationName: trips.destinationName,
        destinationCity: trips.destinationCity,
        omset: trips.omset,
        tax1Pct: trips.tax1Pct,
        taxWithholdingNumber: trips.taxWithholdingNumber,
        taxWithholdingDate: trips.taxWithholdingDate,
      })
      .from(trips)
      .where(and(...tripConditions, sql`${trips.tax1Pct} > 0`))
      .orderBy(trips.unloadingDate)

    withholdingTripDetails = (withholdingTrips ?? []).map((t) => ({
      id: t.id,
      letterNumber: t.orderNumber,
      unloadingDate: t.unloadingDate ?? "",
      factoryName: `${t.destinationCity} - ${t.destinationName}`,
      omset: Number(t.omset) || 0,
      tax1Pct: Number(t.tax1Pct) || 0,
      taxWithholdingNumber: t.taxWithholdingNumber ?? null,
      taxWithholdingDate: t.taxWithholdingDate ?? null,
    }))
  }

  // 7. Run Pure Domain Calculations
  const factoryDeductions =
    tripMetrics.totalDeduction2PctLju + tripMetrics.totalTax1PctWithholding

  const calculations = calculateTaxAccounting({
    grossOmset: tripMetrics.grossOmset,
    driverSangu: tripMetrics.totalSangu,
    driverIncentive: tripMetrics.totalIncentive,
    thirdPartyFee: tripMetrics.totalThirdPartyFee,
    factoryDeductions,
    truckOpex: expenseMetrics.totalOpex,
    tax1PctWithholding: tripMetrics.totalTax1PctWithholding,
  })

  // Format label periode
  const periodMonthStr =
    month !== undefined && month >= 1 && month <= 12
      ? MONTH_NAMES_ID[month - 1]
      : null
  const periodLabel = periodMonthStr
    ? `${periodMonthStr} ${year}`
    : `Tahun ${year} (Rekapitulasi Penuh)`

  return {
    period: {
      year,
      month,
      truckId,
      periodLabel,
    },
    tripMetrics,
    expenseMetrics,
    calculations,
    withholdingTripDetails,
  }
}

export async function getTaxYoyData(
  years: number[] = [2024, 2025, 2026]
): Promise<TaxYoyItem[]> {
  const sortedYears = [...years].sort((a, b) => a - b)
  if (sortedYears.length === 0) return []

  // 1. Ambil agregat ritase tahunan (1 query terpadu dengan GROUP BY tahun)
  const tripYearRows = await db
    .select({
      year: sql<number>`EXTRACT(YEAR FROM ${trips.unloadingDate})::int`,
      totalTrips: sql<number>`count(*)::int`,
      totalTonnage: sql<number>`coalesce(sum(${trips.unloadedTonnage}::numeric), 0)::float`,
      grossOmset: sql<number>`coalesce(sum(${trips.omset}::numeric), 0)::float`,
      totalSangu: sql<number>`coalesce(sum(${trips.sangu}::numeric), 0)::float`,
      totalIncentive: sql<number>`coalesce(sum(${trips.incentivePaid}::numeric), 0)::float`,
      totalThirdPartyFee: sql<number>`coalesce(sum(${trips.thirdPartyFee}::numeric), 0)::float`,
      totalDeduction2PctLju: sql<number>`coalesce(sum(${trips.deduction2PctLju}::numeric), 0)::float`,
      totalTax1Pct: sql<number>`coalesce(sum(${trips.tax1Pct}::numeric), 0)::float`,
    })
    .from(trips)
    .where(
      inArray(
        sql<number>`EXTRACT(YEAR FROM ${trips.unloadingDate})::int`,
        sortedYears
      )
    )
    .groupBy(sql`EXTRACT(YEAR FROM ${trips.unloadingDate})`)

  // 2. Ambil agregat beban operasional tahunan (Excluding DP/Cicilan, 1 query terpadu dengan GROUP BY tahun)
  const expenseYearRows = await db
    .select({
      year: sql<number>`EXTRACT(YEAR FROM ${expenses.expenseDate})::int`,
      totalOpex: sql<number>`coalesce(sum(${expenses.amount}::numeric + ${expenses.adminFee}::numeric), 0)::float`,
    })
    .from(expenses)
    .where(
      and(
        ne(expenses.category, "DP/Cicilan"),
        inArray(
          sql<number>`EXTRACT(YEAR FROM ${expenses.expenseDate})::int`,
          sortedYears
        )
      )
    )
    .groupBy(sql`EXTRACT(YEAR FROM ${expenses.expenseDate})`)

  const tripMap = new Map<number, (typeof tripYearRows)[number]>()
  for (const row of tripYearRows ?? []) {
    tripMap.set(row.year, row)
  }

  const expenseMap = new Map<number, number>()
  for (const row of expenseYearRows ?? []) {
    expenseMap.set(row.year, row.totalOpex)
  }

  return sortedYears.map((year) => {
    const t = tripMap.get(year)
    const grossOmset = t?.grossOmset ?? 0
    const totalSangu = t?.totalSangu ?? 0
    const totalIncentive = t?.totalIncentive ?? 0
    const totalThirdPartyFee = t?.totalThirdPartyFee ?? 0
    const totalDeduction2PctLju = t?.totalDeduction2PctLju ?? 0
    const totalTax1PctWithholding = t?.totalTax1Pct ?? 0
    const truckOpex = expenseMap.get(year) ?? 0

    const factoryDeductions = totalDeduction2PctLju + totalTax1PctWithholding

    const calc = calculateTaxAccounting({
      grossOmset,
      driverSangu: totalSangu,
      driverIncentive: totalIncentive,
      thirdPartyFee: totalThirdPartyFee,
      factoryDeductions,
      truckOpex,
      tax1PctWithholding: totalTax1PctWithholding,
    })

    const recommendedScheme = calc.schemes.find((s) => s.isRecommended)

    return {
      year,
      totalTrips: t?.totalTrips ?? 0,
      totalTonnage: t?.totalTonnage ?? 0,
      grossOmset: calc.bookkeeping.grossOmset,
      netOmset12Pct: calc.bookkeeping.netOmset,
      totalExpenses:
        calc.bookkeeping.directTripExpenses + calc.bookkeeping.truckOpex,
      realOperatingProfit: calc.bookkeeping.realOperatingProfit,
      tax1PctWithholding: calc.bookkeeping.tax1PctWithholding,
      bestSchemeTax: recommendedScheme?.cashBurden ?? 0,
      bestSchemeName: calc.recommendation.bestSchemeName,
    }
  })
}
