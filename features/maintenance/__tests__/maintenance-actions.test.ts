import { beforeEach, describe, expect, it, vi } from "vitest"

const mockReminders = [
  {
    id: "rem-1",
    truckId: "W8187UA",
    reminderType: "oil_change",
    label: "Ganti Oli Mesin",
    dueDate: "2026-10-01",
    isActive: true,
  },
]

const mockOrderBy = vi.fn().mockResolvedValue(mockReminders)
const mockWhere = vi.fn().mockImplementation(() => ({
  orderBy: mockOrderBy,
}))

vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: mockWhere,
      }),
    }),
  },
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/session", () => ({
  getCurrentSession: vi.fn().mockResolvedValue({
    user: { id: "admin-1", role: "admin", name: "Mas Hafidz" },
  }),
}))

describe("maintenance.actions", () => {
  beforeEach(() => vi.clearAllMocks())

  it("createReminder harus mengembalikan success: true untuk admin", async () => {
    const { createReminder } =
      await import("@/features/maintenance/maintenance.actions")
    const result = await createReminder({
      truckId: "W8187UA",
      reminderType: "oil_change",
      label: "Ganti Oli Mesin",
      dueDate: "2026-10-01",
      intervalDays: 90,
    })
    expect(result.success).toBe(true)
  })

  it("updateReminder harus mengembalikan success: true untuk admin", async () => {
    const { updateReminder } =
      await import("@/features/maintenance/maintenance.actions")
    const result = await updateReminder({
      id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      label: "Ganti Oli Mesin (Revisi)",
      dueDate: "2026-10-15",
    })
    expect(result.success).toBe(true)
  })

  it("deleteReminder harus mengembalikan success: true untuk admin", async () => {
    const { deleteReminder } =
      await import("@/features/maintenance/maintenance.actions")
    const result = await deleteReminder("reminder-uuid-1")
    expect(result.success).toBe(true)
  })

  it("getActiveReminders harus mengembalikan daftar reminder aktif", async () => {
    const { getActiveReminders } =
      await import("@/features/maintenance/maintenance.queries")
    const result = await getActiveReminders()
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
    expect(result[0].truckId).toBe("W8187UA")
  })
})
