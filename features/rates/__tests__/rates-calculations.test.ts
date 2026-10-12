import { describe, expect, it } from "vitest"

import {
  resolveAdditionalTonnageCalculation,
  resolveRowFinancialMetrics,
} from "../rates.calculations"

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

  describe("resolveRowFinancialMetrics", () => {
    it("harus menghitung metrik rute standar secara benar", () => {
      const res = resolveRowFinancialMetrics({
        ratePerTon: "100000.00",
        standardTonnage: "31.00",
        sanguPercentage: "0.5200000",
        defaultSangu: null,
        estimatedRevenue: null,
        estimatedProfitTotal: null,
      })

      expect(res.numRate).toBe(100000)
      expect(res.numTon).toBe(31)
      expect(res.rowJumlah).toBe(3100000)
      expect(res.formulaSangu).toBe(1612000)
      expect(res.rowSangu).toBe(1612000)
      expect(res.rowProfit).toBe(1488000)
      expect(res.isManualOverride).toBe(false)
    })

    it("harus memprioritaskan estimatedRevenue dan estimatedProfitTotal untuk rute Indocement", () => {
      const res = resolveRowFinancialMetrics({
        ratePerTon: "214500.00",
        standardTonnage: "31.00",
        sanguPercentage: "0.5740589",
        defaultSangu: "3550000.00",
        estimatedRevenue: "6184035.00",
        estimatedProfitTotal: "2966510.00",
      })

      expect(res.rowJumlah).toBe(6184035)
      expect(res.rowSangu).toBe(3550000)
      expect(res.rowProfit).toBe(2966510)
    })

    it("harus mendeteksi manual override jika defaultSangu berbeda jauh dari formula", () => {
      const res = resolveRowFinancialMetrics({
        ratePerTon: "214500.00",
        standardTonnage: "31.00",
        sanguPercentage: "0.5740589",
        defaultSangu: "3800000.00",
        estimatedRevenue: "6184035.00",
        estimatedProfitTotal: "2966510.00",
      })

      expect(res.rowSangu).toBe(3800000)
      expect(res.isManualOverride).toBe(true)
    })

    it("harus mendeteksi pembulatan historis ribuan (legacy thousand rounding)", () => {
      // rowJumlah = 100.000 * 31 = 3.100.000. Sangu formula = 1.612.000.
      // Jika defaultSangu = 1.612.000 (sama persis dengan formula), bukan override
      const res1 = resolveRowFinancialMetrics({
        ratePerTon: "100000.00",
        standardTonnage: "31.00",
        sanguPercentage: "0.5200000",
        defaultSangu: "1612000.00",
        estimatedRevenue: null,
        estimatedProfitTotal: null,
      })
      expect(res1.isLegacyThousandRounding).toBe(true)
      expect(res1.isManualOverride).toBe(false)
      expect(res1.rowSangu).toBe(1612000)
    })
  })
})
