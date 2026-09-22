import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const mockReturning = vi.fn().mockResolvedValue([
  {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    truckId: "W8187UA",
    expenseDate: "2026-09-07",
    category: "Servis",
    description: "Jasa cek rem",
    amount: "250000.00",
    adminFee: "0.00",
  },
])

const mockWhere = vi.fn().mockImplementation(() => ({
  returning: mockReturning,
}))

const mockSet = vi.fn().mockImplementation(() => ({
  where: mockWhere,
}))

const mockValues = vi.fn().mockImplementation(() => ({
  returning: mockReturning,
}))

const mockDeleteWhere = vi.fn().mockResolvedValue([])

vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockImplementation(() => ({
      values: mockValues,
    })),
    update: vi.fn().mockImplementation(() => ({
      set: mockSet,
    })),
    delete: vi.fn().mockImplementation(() => ({
      where: mockDeleteWhere,
    })),
  },
}))

vi.mock("@/lib/session", () => ({
  getCurrentSession: vi.fn().mockResolvedValue(null),
}))

vi.mock("@/lib/rbac", () => ({
  assertAdmin: vi.fn(),
}))

describe("expenses.actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("createExpense returns validation error for invalid input", async () => {
    const { createExpense } =
      await import("@/features/expenses/expenses.actions")
    const result = await createExpense({
      truckId: "W8187UA",
      expenseDate: "2026-09-07",
      category: "INVALID" as never,
      description: "",
      amount: "-100",
      adminFee: "0.00",
      location: null,
      repairNotes: null,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeDefined()
    }
  })

  it("createExpense succeeds for valid input", async () => {
    const { createExpense } =
      await import("@/features/expenses/expenses.actions")
    const result = await createExpense({
      truckId: "W8187UA",
      expenseDate: "2026-09-07",
      category: "Servis",
      description: "Jasa cek rem",
      amount: "250000.00",
      adminFee: "0.00",
      location: "Tuban",
      repairNotes: null,
    })

    expect(result.success).toBe(true)
  })

  it("updateExpense succeeds for valid input", async () => {
    const { updateExpense } =
      await import("@/features/expenses/expenses.actions")
    const result = await updateExpense({
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      truckId: "W8187UA",
      expenseDate: "2026-09-07",
      category: "Servis",
      description: "Jasa cek rem diperbarui",
      amount: "300000.00",
      adminFee: "0.00",
      location: "Tuban",
      repairNotes: null,
    })

    expect(result.success).toBe(true)
  })

  it("deleteExpense succeeds with valid ID", async () => {
    const { deleteExpense } =
      await import("@/features/expenses/expenses.actions")
    const result = await deleteExpense("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
    expect(result.success).toBe(true)
  })
})
