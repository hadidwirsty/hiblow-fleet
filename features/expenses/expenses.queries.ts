import { and, desc, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import { expenses } from "@/db/schema"
import type { Expense } from "@/db/schema"

export interface ListExpensesFilter {
  truckId?: string
  month?: number
  year?: number
  category?: string
}

export interface ExpensesSummary {
  totalCount: number
  totalExpenses: number
  totalAmount: number
  totalAdminFee: number
}

export async function listExpenses(
  filter: ListExpensesFilter = {}
): Promise<Expense[]> {
  const conditions = []

  if (filter.truckId) {
    conditions.push(eq(expenses.truckId, filter.truckId))
  }

  if (filter.category) {
    conditions.push(eq(expenses.category, filter.category))
  }

  if (filter.month && filter.year) {
    conditions.push(
      sql`EXTRACT(MONTH FROM ${expenses.expenseDate}) = ${filter.month}`,
      sql`EXTRACT(YEAR FROM ${expenses.expenseDate}) = ${filter.year}`
    )
  }

  return db
    .select()
    .from(expenses)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(expenses.expenseDate))
}

export async function getExpensesSummary(
  filter: ListExpensesFilter = {}
): Promise<ExpensesSummary> {
  const conditions = []

  if (filter.truckId) {
    conditions.push(eq(expenses.truckId, filter.truckId))
  }

  if (filter.category) {
    conditions.push(eq(expenses.category, filter.category))
  }

  if (filter.month && filter.year) {
    conditions.push(
      sql`EXTRACT(MONTH FROM ${expenses.expenseDate}) = ${filter.month}`,
      sql`EXTRACT(YEAR FROM ${expenses.expenseDate}) = ${filter.year}`
    )
  }

  const [result] = await db
    .select({
      totalCount: sql<number>`count(*)::int`,
      totalExpenses: sql<number>`coalesce(sum(${expenses.amount}::numeric + ${expenses.adminFee}::numeric), 0)::float`,
      totalAmount: sql<number>`coalesce(sum(${expenses.amount}::numeric), 0)::float`,
      totalAdminFee: sql<number>`coalesce(sum(${expenses.adminFee}::numeric), 0)::float`,
    })
    .from(expenses)
    .where(conditions.length > 0 ? and(...conditions) : undefined)

  return (
    result ?? {
      totalCount: 0,
      totalExpenses: 0,
      totalAmount: 0,
      totalAdminFee: 0,
    }
  )
}
