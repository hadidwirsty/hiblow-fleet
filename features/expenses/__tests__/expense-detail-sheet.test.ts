import { describe, expect, it } from "vitest"
import { formatPlateNumber, getDriverAndTruck } from "@/domain/trucks"
import type { Expense } from "@/db/schema"

describe("ExpenseDetailSheet Logic and Formatters", () => {
  const sampleExpense: Expense = {
    id: "exp-001",
    truckId: "W8187UA",
    expenseDate: "2025-06-05",
    category: "GPS",
    description: "GPS Idtrack Truk 1 Tahun",
    quantity: "1 unit",
    amount: "850000.00",
    adminFee: "2500.00",
    location: "RTGS",
    repairNotes: "Garansi 1 tahun",
    createdAt: new Date("2025-06-05"),
  }

  it("correctly calculates total expense from amount and adminFee", () => {
    const amountNum = parseFloat(String(sampleExpense.amount)) || 0
    const adminNum = parseFloat(String(sampleExpense.adminFee ?? "0")) || 0
    const totalBeban = amountNum + adminNum

    expect(amountNum).toBe(850000)
    expect(adminNum).toBe(2500)
    expect(totalBeban).toBe(852500)
  })

  it("handles zero or null adminFee without NaN errors", () => {
    const amountNum = parseFloat("1000000.00") || 0
    const adminNum = parseFloat("0.00") || 0
    const totalBeban = amountNum + adminNum

    expect(totalBeban).toBe(1000000)
  })

  it("resolves truck plate and driver correctly", () => {
    expect(formatPlateNumber("W8187UA")).toBe("W 8187 UA")
    expect(formatPlateNumber("H8133OF")).toBe("H 8133 OF")

    const wDriver = getDriverAndTruck("W8187UA")
    expect(wDriver.driver).toBe("Triyono")
    expect(wDriver.plate).toBe("W 8187 UA")

    const hDriver = getDriverAndTruck("H8133OF")
    expect(hDriver.driver).toBe("Khoirul")
    expect(hDriver.plate).toBe("H 8133 OF")
  })
})
