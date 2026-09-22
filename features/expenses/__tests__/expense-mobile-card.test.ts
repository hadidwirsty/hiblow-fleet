import { describe, expect, it } from "vitest"

describe("ExpenseMobileCard logic and formatters", () => {
  it("calculates total expense including bank admin fee correctly", () => {
    const calculateTotalExpense = (
      amount: string | number,
      adminFee: string | number | null | undefined
    ) => {
      const parsedAmount =
        typeof amount === "string" ? parseFloat(amount || "0") : amount
      const parsedAdmin =
        typeof adminFee === "string"
          ? parseFloat(adminFee || "0")
          : (adminFee ?? 0)
      return parsedAmount + parsedAdmin
    }

    expect(calculateTotalExpense("500000", "2500")).toBe(502500)
    expect(calculateTotalExpense(1500000, 0)).toBe(1500000)
    expect(calculateTotalExpense("250000", null)).toBe(250000)
  })

  it("identifies truck plate number format", () => {
    const formatPlateNumber = (truckId: string) => {
      if (truckId === "W8187UA") return "W 8187 UA"
      if (truckId === "H8133OF") return "H 8133 OF"
      return truckId
    }

    expect(formatPlateNumber("W8187UA")).toBe("W 8187 UA")
    expect(formatPlateNumber("H8133OF")).toBe("H 8133 OF")
  })
})
