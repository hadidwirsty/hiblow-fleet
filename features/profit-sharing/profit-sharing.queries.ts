import { and, desc, eq, gte, lte, ne, sql } from "drizzle-orm"

import { db } from "@/db"
import {
  expenses,
  profitShares,
  profitSharingPeriods,
  trips,
} from "@/db/schema"
import type { ProfitShare, ProfitSharingPeriod } from "@/db/schema"

/**
 * Mendapatkan total pemasukan (omset) pada rentang tanggal bongkar.
 */
export async function getIncomeForPeriod(
  startDate: string,
  endDate: string
): Promise<number> {
  const [result] = await db
    .select({
      totalIncome: sql<number>`coalesce(sum(${trips.omset}::numeric), 0)::float`,
    })
    .from(trips)
    .where(
      and(
        gte(trips.unloadingDate, startDate),
        lte(trips.unloadingDate, endDate)
      )
    )

  return result?.totalIncome ?? 0
}

/**
 * Mendapatkan total beban pengeluaran pada rentang tanggal,
 * mengecualikan kategori non-operasional tertentu (default: 'DP/Cicilan').
 */
export async function getExpensesForPeriod(
  startDate: string,
  endDate: string,
  excludeCategory: string = "DP/Cicilan"
): Promise<number> {
  const [result] = await db
    .select({
      totalExpenses: sql<number>`coalesce(sum(${expenses.amount}::numeric + ${expenses.adminFee}::numeric), 0)::float`,
    })
    .from(expenses)
    .where(
      and(
        gte(expenses.expenseDate, startDate),
        lte(expenses.expenseDate, endDate),
        ne(expenses.category, excludeCategory)
      )
    )

  return result?.totalExpenses ?? 0
}

/**
 * Mengambil seluruh periode bagi hasil yang tersimpan.
 */
export async function listProfitSharingPeriods(): Promise<
  ProfitSharingPeriod[]
> {
  return db
    .select()
    .from(profitSharingPeriods)
    .orderBy(
      desc(profitSharingPeriods.startDate),
      desc(profitSharingPeriods.createdAt)
    )
}

/**
 * Mengambil seluruh periode bagi hasil beserta relasi shares-nya.
 */
export async function listProfitSharingPeriodsWithShares(): Promise<
  ProfitSharingPeriodDetail[]
> {
  const periods = await listProfitSharingPeriods()
  if (periods.length === 0) return []

  const allShares = await db
    .select()
    .from(profitShares)
    .orderBy(desc(profitShares.capitalShare))

  const sharesByPeriodId = new Map<string, ProfitShare[]>()
  for (const share of allShares) {
    const list = sharesByPeriodId.get(share.periodId) ?? []
    list.push(share)
    sharesByPeriodId.set(share.periodId, list)
  }

  return periods.map((period) => ({
    ...period,
    shares: sharesByPeriodId.get(period.id) ?? [],
  }))
}

export type ProfitSharingPeriodDetail = ProfitSharingPeriod & {
  shares: ProfitShare[]
}

/**
 * Mengambil detail satu periode bagi hasil beserta porsi masing-masing pemodal.
 */
export async function getProfitSharingPeriodDetail(
  id: string
): Promise<ProfitSharingPeriodDetail | null> {
  const [period] = await db
    .select()
    .from(profitSharingPeriods)
    .where(eq(profitSharingPeriods.id, id))

  if (!period) return null

  const shares = await db
    .select()
    .from(profitShares)
    .where(eq(profitShares.periodId, id))
    .orderBy(desc(profitShares.capitalShare))

  return {
    ...period,
    shares,
  }
}
