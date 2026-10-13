import { describe, expect, it } from "vitest"

import { calculateTripClaim } from "@/domain/calculators/trip-claim"

describe("calculateTripClaim", () => {
  it("harus mengembalikan klaim 0 jika tonase bongkar >= tonase muat (pas atau plus)", () => {
    // Kasus 1: Pas
    const res1 = calculateTripClaim({
      loadedTonnage: 31.0,
      unloadedTonnage: 31.0,
      ratePerTon: 100000,
    })
    expect(res1.isMinus).toBe(false)
    expect(res1.isExceedingTolerance).toBe(false)
    expect(res1.shrinkageTonnage).toBe(0)
    expect(res1.claimableTonnage).toBe(0)
    expect(res1.totalClaimAmount).toBe(0)
    expect(res1.companyClaim).toBe(0)
    expect(res1.driverClaim).toBe(0)

    // Kasus 2: Plus (+0.50 ton)
    const res2 = calculateTripClaim({
      loadedTonnage: 31.0,
      unloadedTonnage: 31.5,
      ratePerTon: 100000,
    })
    expect(res2.isMinus).toBe(false)
    expect(res2.isExceedingTolerance).toBe(false)
    expect(res2.shrinkageTonnage).toBe(0)
    expect(res2.totalClaimAmount).toBe(0)
  })

  it("harus mengembalikan klaim 0 jika susut muatan masih dalam batas toleransi 0.3%", () => {
    // Muatan 31 ton, toleransi 0.3% = 0.093 ton (93 kg)
    // Susut 0.05 ton (50 kg) -> masih di bawah toleransi 93 kg
    const res = calculateTripClaim({
      loadedTonnage: 31.0,
      unloadedTonnage: 30.95,
      ratePerTon: 100000,
    })
    expect(res.isMinus).toBe(true)
    expect(res.shrinkageTonnage).toBe(0.05)
    expect(res.toleranceTonnage).toBe(0.093)
    expect(res.isExceedingTolerance).toBe(false)
    expect(res.claimableTonnage).toBe(0)
    expect(res.totalClaimAmount).toBe(0)
    expect(res.companyClaim).toBe(0)
    expect(res.driverClaim).toBe(0)
  })

  it("harus menghitung klaim dan membagi 50:50 jika susut melebihi toleransi 0.3%", () => {
    // Muatan 31 ton, toleransi 0.3% = 0.093 ton (93 kg)
    // Bongkar 30.50 ton -> susut 0.50 ton (500 kg)
    // Kelebihan susut yang diklaim = 0.50 - 0.093 = 0.407 ton (407 kg)
    // Tarif OA/Ton = Rp 100.000
    // Total klaim = 0.407 * 100.000 = Rp 40.700
    // 50% perusahaan = Rp 20.350, 50% supir = Rp 20.350
    const res = calculateTripClaim({
      loadedTonnage: 31.0,
      unloadedTonnage: 30.5,
      ratePerTon: 100000,
    })
    expect(res.isMinus).toBe(true)
    expect(res.shrinkageTonnage).toBe(0.5)
    expect(res.toleranceTonnage).toBe(0.093)
    expect(res.isExceedingTolerance).toBe(true)
    expect(res.claimableTonnage).toBe(0.407)
    expect(res.totalClaimAmount).toBe(40700)
    expect(res.companyClaim).toBe(20350)
    expect(res.driverClaim).toBe(20350)
  })

  it("harus menangani pembulatan ganjil 50:50 tanpa kehilangan 1 rupiah", () => {
    // Misal total klaim ganjil Rp 40.701
    // Company: 20.351, Driver: 20.350 -> total tetap 40.701
    const res = calculateTripClaim({
      loadedTonnage: 31.0,
      unloadedTonnage: 30.5,
      ratePerTon: 100001,
    })
    expect(res.companyClaim + res.driverClaim).toBe(res.totalClaimAmount)
  })

  it("harus mendukung input string dengan toleransi default 0.3%", () => {
    const res = calculateTripClaim({
      loadedTonnage: "31.00",
      unloadedTonnage: "30.50",
      ratePerTon: "100000.00",
    })
    expect(res.isMinus).toBe(true)
    expect(res.totalClaimAmount).toBe(40700)
  })
})
