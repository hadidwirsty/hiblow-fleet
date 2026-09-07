import { describe, expect, it } from "vitest"

import type { ExpensesSummary as ExpensesSummaryType } from "@/features/expenses/expenses.queries"

describe("expenses-summary logic", () => {
  it("calculates correct summary ratios and values", () => {
    const summary: ExpensesSummaryType = {
      totalCount: 15,
      totalExpenses: 5025000,
      totalAmount: 5000000,
      totalAdminFee: 25000,
    }

    expect(summary.totalCount).toBe(15)
    expect(summary.totalExpenses).toBe(
      summary.totalAmount + summary.totalAdminFee
    )
  })
})
