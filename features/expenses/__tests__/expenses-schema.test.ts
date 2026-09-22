/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, expect, it } from "vitest"

import {
  createExpenseSchema,
  updateExpenseSchema,
} from "@/features/expenses/expenses.schema"

const validInput = {
  truckId: "W8187UA" as const,
  expenseDate: "2026-09-07",
  category: "Servis" as const,
  description: "Jasa cek mesin dan ganti filter oli",
  amount: "500000.00",
  adminFee: "2500.00",
  location: "Tuban",
  repairNotes: null,
}

describe("createExpenseSchema", () => {
  it("accepts valid input", () => {
    const result = createExpenseSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it("rejects invalid truckId", () => {
    const result = createExpenseSchema.safeParse({
      ...validInput,
      truckId: "B1234XYZ",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid category", () => {
    const result = createExpenseSchema.safeParse({
      ...validInput,
      category: "INVALID_CAT",
    })
    expect(result.success).toBe(false)
  })

  it("rejects amount <= 0 or empty", () => {
    const emptyResult = createExpenseSchema.safeParse({
      ...validInput,
      amount: "",
    })
    expect(emptyResult.success).toBe(false)

    const zeroResult = createExpenseSchema.safeParse({
      ...validInput,
      amount: "0",
    })
    expect(zeroResult.success).toBe(false)

    const negativeResult = createExpenseSchema.safeParse({
      ...validInput,
      amount: "-50000",
    })
    expect(negativeResult.success).toBe(false)
  })

  it("applies default adminFee of 0.00 when not provided", () => {
    const { adminFee, ...withoutAdminFee } = validInput
    const result = createExpenseSchema.safeParse(withoutAdminFee)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.adminFee).toBe("0.00")
    }
  })
})

describe("updateExpenseSchema", () => {
  it("accepts valid update input with UUID", () => {
    const result = updateExpenseSchema.safeParse({
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      ...validInput,
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid UUID in update input", () => {
    const result = updateExpenseSchema.safeParse({
      id: "not-a-uuid",
      ...validInput,
    })
    expect(result.success).toBe(false)
  })
})
