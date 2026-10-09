import { describe, expect, it } from "vitest"

import { resolveAdditionalTonnageCalculation } from "../rates.calculations"

describe("rates.calculations", () => {
  describe("resolveAdditionalTonnageCalculation", () => {
    it("harus mendeteksi persentase bulat yang cocok (misal 30% pada rute Blora: 30% x 47.869 = 14.361)", () => {
      const res = resolveAdditionalTonnageCalculation(47869, 14361)
      expect(res.isPercentage).toBe(true)
      expect(res.percentage).toBe(30)
    })

    it("harus mengembalikan isPercentage: false jika nominal tidak cocok dengan persentase bulat", () => {
      // Nominal tetap acuan manual 25.000 pada tarif 214.500
      const res = resolveAdditionalTonnageCalculation(214500, 25000)
      expect(res.isPercentage).toBe(false)
      expect(res.percentage).toBe(0)
    })

    it("harus mengembalikan isPercentage: false jika salah satu input bernilai 0 atau negatif", () => {
      expect(resolveAdditionalTonnageCalculation(0, 10000)).toEqual({
        isPercentage: false,
        percentage: 0,
      })
      expect(resolveAdditionalTonnageCalculation(50000, 0)).toEqual({
        isPercentage: false,
        percentage: 0,
      })
      expect(resolveAdditionalTonnageCalculation(-1000, 500)).toEqual({
        isPercentage: false,
        percentage: 0,
      })
    })
  })
})
