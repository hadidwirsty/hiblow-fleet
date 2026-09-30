import { describe, expect, it } from "vitest"

import { formatPercentage } from "@/lib/utils"

describe("RateMobileCard logic and formatters", () => {
  it("formats sangu percentage into human readable string with up to 5 decimals", () => {
    expect(formatPercentage(0.52)).toBe("52%")
    expect(formatPercentage("0.5")).toBe("50%")
    expect(formatPercentage("0.475")).toBe("47,5%")
    expect(formatPercentage("0.5258552")).toBe("52,58552%")
    expect(formatPercentage("0.4780845")).toBe("47,80845%")
  })

  it("calculates estimated driver sangu based on standard tonnage and percentage", () => {
    const calculateEstimatedSangu = (
      ratePerTon: string,
      sanguPct: string,
      standardTon = "31"
    ) => {
      const numRate = parseFloat(ratePerTon)
      const numPct = parseFloat(sanguPct)
      const numTon = parseFloat(standardTon)
      const jumlah = Math.round(numRate * numTon)
      return Math.round(jumlah * numPct)
    }

    // Misal: Tarif 120.000 / ton, 31 ton = 3.720.000, sangu 50% = 1.860.000
    expect(calculateEstimatedSangu("120000", "0.50", "31")).toBe(1860000)

    // Contoh Rute Cepu: Jumlah 2.513.412, sangu 52% = 1.306.974 (bukan 1.307.000)
    expect(calculateEstimatedSangu("81077.8", "0.52", "31")).toBe(1306974)

    // Contoh dengan 5 angka di belakang koma: 52,58552% (0.5258552)
    // 81.077,8 x 31 = 2.513.412, 2.513.412 x 0.5258552 = 1.321.690,65 -> 1.321.691
    expect(calculateEstimatedSangu("81077.8", "0.5258552", "31")).toBe(1321691)
  })

  it("calculates additional tonnage rate from rounded rate percentage", () => {
    const calculateAdditionalTonnageRate = (
      ratePerTon: string,
      percentage = 30
    ) => {
      const numRate = parseFloat(ratePerTon)
      const roundedTarif = Math.round(numRate)
      return Math.round(roundedTarif * (percentage / 100))
    }

    // Contoh Rute Jepara: Tarif 102.539,5 dibulatkan 102.540, 30% = 30.762
    expect(calculateAdditionalTonnageRate("102539.5", 30)).toBe(30762)
    // Custom persentase 35%
    expect(calculateAdditionalTonnageRate("102539.5", 35)).toBe(35889)
  })
})
