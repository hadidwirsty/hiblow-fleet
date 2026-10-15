import { describe, expect, it, vi } from "vitest"

import { createTrip, updateTrip } from "@/features/trips/trips.actions"

// Mock Drizzle db module
vi.mock("@/db", () => {
  return {
    db: {
      insert: vi.fn(),
      update: vi.fn(),
    },
  }
})

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentSession: vi.fn().mockResolvedValue({
    user: { id: "admin-1", role: "Super Admin" },
  }),
}))

describe("trips.actions with tax withholding fields", () => {
  const baseTripInput = {
    truckId: "W8187UA" as const,
    orderNumber: "7911-ZLF-2026",
    orderDate: "2026-10-15",
    unloadingDate: "2026-10-16",
    destinationCity: "Tuban",
    destinationName: "SI Tuban",
    ratePerTon: "95000.00",
    unloadedTonnage: "31.00",
    omset: "2945000.00",
    sangu: "1531000.00",
    incentiveRate: "35000.00",
    incentivePaid: "0.00",
    thirdPartyFee: "0.00",
    tax1Pct: "29450.00",
    deduction2PctLju: "0.00",
    deduction5PctUjGrb: "0.00",
    mealAllowance: "0.00",
    savings: "0.00",
    claim: "0.00",
    claimDriver: "0.00",
    profit: "1414000.00",
  }

  it("passes taxWithholdingNumber and taxWithholdingDate to db.insert in createTrip", async () => {
    const { db } = await import("@/db")

    let capturedValues: Record<string, unknown> = {}
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockImplementation((val: Record<string, unknown>) => {
        capturedValues = val
        return {
          returning: vi.fn().mockResolvedValue([{ id: "trip-123", ...val }]),
        }
      }),
    } as unknown as ReturnType<typeof db.insert>)

    const result = await createTrip({
      ...baseTripInput,
      taxWithholdingNumber: "BP-SI-2026-999",
      taxWithholdingDate: "2026-10-16",
    })

    expect(result.success).toBe(true)
    expect(capturedValues.taxWithholdingNumber).toBe("BP-SI-2026-999")
    expect(capturedValues.taxWithholdingDate).toBe("2026-10-16")
  })

  it("passes taxWithholdingNumber and taxWithholdingDate to db.update in updateTrip", async () => {
    const { db } = await import("@/db")

    let capturedUpdate: Record<string, unknown> = {}
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockImplementation((val: Record<string, unknown>) => {
        capturedUpdate = val
        return {
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([
                { id: "b3f07a48-52be-49c0-93cb-56a81b37f480", ...val },
              ]),
          }),
        }
      }),
    } as unknown as ReturnType<typeof db.update>)

    const result = await updateTrip({
      id: "b3f07a48-52be-49c0-93cb-56a81b37f480",
      ...baseTripInput,
      taxWithholdingNumber: "BP-SI-2026-UPDATED",
      taxWithholdingDate: "2026-10-17",
    })

    expect(result.success).toBe(true)
    expect(capturedUpdate.taxWithholdingNumber).toBe("BP-SI-2026-UPDATED")
    expect(capturedUpdate.taxWithholdingDate).toBe("2026-10-17")
  })
})
