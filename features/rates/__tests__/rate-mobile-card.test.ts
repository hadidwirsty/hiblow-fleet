import { describe, expect, it } from "vitest"

describe("RateMobileCard logic and formatters", () => {
  it("formats sangu percentage into human readable string", () => {
    const formatPercent = (val: string | number) =>
      `${(parseFloat(String(val)) * 100).toFixed(1)}%`

    expect(formatPercent(0.52)).toBe("52.0%")
    expect(formatPercent("0.5")).toBe("50.0%")
    expect(formatPercent("0.475")).toBe("47.5%")
  })

  it("calculates estimated driver sangu based on standard tonnage", () => {
    const calculateEstimatedSangu = (
      ratePerTon: string,
      sanguPct: string,
      standardTon = "31"
    ) => {
      const numRate = parseFloat(ratePerTon)
      const numPct = parseFloat(sanguPct)
      const numTon = parseFloat(standardTon)
      return Math.round((numRate * numTon * numPct) / 1000) * 1000
    }

    // Misal: Tarif 120.000 / ton, 31 ton = 3.720.000, sangu 50% = 1.860.000
    expect(calculateEstimatedSangu("120000", "0.50", "31")).toBe(1860000)
  })
})
