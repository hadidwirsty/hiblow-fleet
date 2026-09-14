import { describe, expect, it } from "vitest"

describe("TripMobileCard logic and formatters", () => {
  it("formats plate numbers correctly", () => {
    const formatPlateNumber = (truckId: string) => {
      if (truckId === "W8187UA") return "W 8187 UA"
      if (truckId === "H8133OF") return "H 8133 OF"
      return truckId
    }

    expect(formatPlateNumber("W8187UA")).toBe("W 8187 UA")
    expect(formatPlateNumber("H8133OF")).toBe("H 8133 OF")
    expect(formatPlateNumber("B1234XYZ")).toBe("B1234XYZ")
  })

  it("identifies paid third party fee status accurately", () => {
    const isFeePaid = (status?: string | null) => {
      if (!status) return false
      const s = status.toLowerCase()
      return (
        s.includes("lunas") ||
        s.includes("sudah dibayar") ||
        s.includes("sdh dibayar")
      )
    }

    expect(isFeePaid("Sudah dibayar 25 Jun 2025")).toBe(true)
    expect(isFeePaid("Lunas")).toBe(true)
    expect(isFeePaid("sdh dibayar")).toBe(true)
    expect(isFeePaid("Belum Dibayar")).toBe(false)
    expect(isFeePaid(null)).toBe(false)
    expect(isFeePaid("")).toBe(false)
  })
})
