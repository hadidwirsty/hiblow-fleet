import { describe, expect, it } from "vitest"

import {
  calculateIndocementParameters,
  isIndocementRoute,
} from "@/features/rates/rates.indocement"

describe("Indocement Grobogan Calculation Engine", () => {
  it("harus menghitung parameter Indocement Grobogan secara akurat berdasarkan tarif, tonase, dan persentase sangu", () => {
    // Skenario rute Wagir (Malang):
    // Tarif OA = 214.500, Tonase = 31, UJ 31 Ton (Sangu) = 3.550.000
    // Persentase sangu = 3.550.000 / 6.184.035 = ~57.40588%
    const result = calculateIndocementParameters({
      ratePerTon: 214500,
      standardTonnage: 31,
      sanguPercentage: 57.40588, // dalam persen
    })

    expect(result.saving5Percent).toBe(10725)
    expect(result.deduction2Percent).toBe(4290)
    expect(result.ljuDeduction).toBe(132990)
    expect(result.oaDriver).toBe(199485)
    expect(result.estimatedRevenue).toBe(6184035)
    expect(result.uj31Ton).toBe(3550000)
    expect(result.estimatedProfitBase).toBe(2634035)
    expect(result.totalSaving).toBe(332475)
    expect(result.estimatedProfitTotal).toBe(2966510)
  })

  it("harus menghitung Sangu Rp3.550.000 dan Keuntungan Rp2.634.035 dengan input persentase 57.40589% dari sheet real", () => {
    const result = calculateIndocementParameters({
      ratePerTon: 214500,
      standardTonnage: 31,
      sanguPercentage: 57.40589,
    })

    expect(result.estimatedRevenue).toBe(6184035)
    expect(result.uj31Ton).toBe(3550000)
    expect(result.estimatedProfitBase).toBe(2634035)
    expect(result.totalSaving).toBe(332475)
    expect(result.estimatedProfitTotal).toBe(2966510)
  })

  it("harus mendukung override UJ 31 Ton secara langsung untuk menghitung keuntungan dan profit", () => {
    const result = calculateIndocementParameters({
      ratePerTon: 214500,
      standardTonnage: 31,
      overrideSangu: 3550000,
    })

    expect(result.saving5Percent).toBe(10725)
    expect(result.deduction2Percent).toBe(4290)
    expect(result.ljuDeduction).toBe(132990)
    expect(result.oaDriver).toBe(199485)
    expect(result.estimatedRevenue).toBe(6184035)
    expect(result.uj31Ton).toBe(3550000)
    expect(result.estimatedProfitBase).toBe(2634035)
    expect(result.totalSaving).toBe(332475)
    expect(result.estimatedProfitTotal).toBe(2966510)
  })

  it("harus mengembalikan nilai 0 jika input tarif atau tonase tidak valid", () => {
    const result = calculateIndocementParameters({
      ratePerTon: 0,
      standardTonnage: 0,
    })

    expect(result.saving5Percent).toBe(0)
    expect(result.deduction2Percent).toBe(0)
    expect(result.ljuDeduction).toBe(0)
    expect(result.oaDriver).toBe(0)
    expect(result.estimatedRevenue).toBe(0)
    expect(result.uj31Ton).toBe(0)
    expect(result.estimatedProfitBase).toBe(0)
    expect(result.totalSaving).toBe(0)
    expect(result.estimatedProfitTotal).toBe(0)
  })

  describe("isIndocementRoute helper", () => {
    it("harus mendeteksi dari string nama pabrik", () => {
      expect(isIndocementRoute("Indocement - Grobogan")).toBe(true)
      expect(isIndocementRoute("grobogan")).toBe(true)
      expect(isIndocementRoute("Semen Indonesia (SI) - Tuban")).toBe(false)
      expect(isIndocementRoute("Solusi Bangun Indonesia (SBI) - Tuban")).toBe(
        false
      )
      expect(isIndocementRoute(null)).toBe(false)
    })

    it("harus mendeteksi dari objek rute", () => {
      expect(isIndocementRoute({ originPlant: "Indocement - Grobogan" })).toBe(
        true
      )
      expect(
        isIndocementRoute({
          originPlant: "SI - Tuban",
          estimatedProfitTotal: "2966510.00",
        })
      ).toBe(true)
      expect(
        isIndocementRoute({
          originPlant: "SI - Tuban",
          estimatedProfitTotal: null,
        })
      ).toBe(false)
    })
  })
})
