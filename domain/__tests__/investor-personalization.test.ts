import { describe, expect, it } from "vitest"

import { extractMyShares } from "@/domain/investor-personalization"

const mockPeriods = [
  {
    id: "period-1",
    shares: [
      {
        periodId: "period-1",
        partnerUserId: "user-hadid",
        partnerName: "Hadid",
        payoutAmount: "5000000",
        capitalShare: "4000000",
        sharePercentage: "0.006897",
        notes: null,
      },
      {
        periodId: "period-1",
        partnerUserId: "user-alfiah",
        partnerName: "Alfiah",
        payoutAmount: "43000000",
        capitalShare: "50000000",
        sharePercentage: "0.086207",
        notes: null,
      },
    ],
  },
  {
    id: "period-2",
    shares: [
      {
        periodId: "period-2",
        partnerUserId: "user-hadid",
        partnerName: "Hadid",
        payoutAmount: "6000000",
        capitalShare: "4000000",
        sharePercentage: "0.006897",
        notes: null,
      },
    ],
  },
]

describe("extractMyShares", () => {
  it("returns empty Map for empty userId", () => {
    const result = extractMyShares(mockPeriods, "")
    expect(result.size).toBe(0)
  })

  it("returns empty Map for userId with no matching shares", () => {
    const result = extractMyShares(mockPeriods, "user-unknown")
    expect(result.size).toBe(0)
  })

  it("returns Map with periodId -> payoutAmount for matching userId", () => {
    const result = extractMyShares(mockPeriods, "user-hadid")
    expect(result.size).toBe(2)
    expect(result.get("period-1")).toBe(5_000_000)
    expect(result.get("period-2")).toBe(6_000_000)
  })

  it("only includes shares matching the given userId", () => {
    const result = extractMyShares(mockPeriods, "user-alfiah")
    expect(result.size).toBe(1)
    expect(result.get("period-1")).toBe(43_000_000)
    expect(result.has("period-2")).toBe(false)
  })

  it("handles periods with no shares array gracefully", () => {
    const periodsWithEmpty = [{ id: "period-3", shares: [] }]
    const result = extractMyShares(periodsWithEmpty, "user-hadid")
    expect(result.size).toBe(0)
  })
})
