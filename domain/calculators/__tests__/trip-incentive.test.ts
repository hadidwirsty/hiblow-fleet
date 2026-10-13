import { describe, expect, it } from "vitest"

import { calculateTripIncentive } from "@/domain/calculators/trip-incentive"

describe("calculateTripIncentive", () => {
  it("harus mengembalikan 0 ton dan insentif Rp 0 jika selisih bongkar - muat <= 0.85 ton", () => {
    // Kasus 1: Selisih minus (susut)
    const res1 = calculateTripIncentive({
      loadedTonnage: 31.0,
      unloadedTonnage: 30.5,
      additionalTonnageRate: 50000,
    })
    expect(res1.excessTonnage).toBe(0)
    expect(res1.incentivePaid).toBe(0)
    expect(res1.isEligible).toBe(false)
    expect(res1.tonnageDifference).toBe(-0.5)

    // Kasus 2: Selisih pas (0)
    const res2 = calculateTripIncentive({
      loadedTonnage: 31.0,
      unloadedTonnage: 31.0,
      additionalTonnageRate: 50000,
    })
    expect(res2.excessTonnage).toBe(0)
    expect(res2.incentivePaid).toBe(0)
    expect(res2.isEligible).toBe(false)

    // Kasus 3: Selisih lebih 0.50 ton (masih <= 0.85)
    const res3 = calculateTripIncentive({
      loadedTonnage: 31.0,
      unloadedTonnage: 31.5,
      additionalTonnageRate: 50000,
    })
    expect(res3.excessTonnage).toBe(0)
    expect(res3.incentivePaid).toBe(0)
    expect(res3.isEligible).toBe(false)

    // Kasus 4: Tepat di batas ambang 0.85 ton
    const res4 = calculateTripIncentive({
      loadedTonnage: 31.0,
      unloadedTonnage: 31.85,
      additionalTonnageRate: 50000,
    })
    expect(res4.excessTonnage).toBe(0)
    expect(res4.incentivePaid).toBe(0)
    expect(res4.isEligible).toBe(false)
  })

  it("harus menghitung kelebihan 1 ton jika selisih > 0.85 dan <= 1.85 ton", () => {
    // 0.86 ton -> kelebihan 1 ton
    const res1 = calculateTripIncentive({
      loadedTonnage: 31.0,
      unloadedTonnage: 31.86,
      additionalTonnageRate: 50000,
    })
    expect(res1.excessTonnage).toBe(1)
    expect(res1.incentivePaid).toBe(50000)
    expect(res1.isEligible).toBe(true)

    // 1.00 ton -> kelebihan 1 ton
    const res2 = calculateTripIncentive({
      loadedTonnage: 31.0,
      unloadedTonnage: 32.0,
      additionalTonnageRate: 50000,
    })
    expect(res2.excessTonnage).toBe(1)
    expect(res2.incentivePaid).toBe(50000)
    expect(res2.isEligible).toBe(true)

    // 1.85 ton -> kelebihan 1 ton
    const res3 = calculateTripIncentive({
      loadedTonnage: 31.0,
      unloadedTonnage: 32.85,
      additionalTonnageRate: 50000,
    })
    expect(res3.excessTonnage).toBe(1)
    expect(res3.incentivePaid).toBe(50000)
    expect(res3.isEligible).toBe(true)
  })

  it("harus menghitung kelebihan 2 ton jika selisih > 1.85 dan <= 2.85 ton", () => {
    // 1.86 ton -> kelebihan 2 ton
    const res1 = calculateTripIncentive({
      loadedTonnage: 31.0,
      unloadedTonnage: 32.86,
      additionalTonnageRate: 50000,
    })
    expect(res1.excessTonnage).toBe(2)
    expect(res1.incentivePaid).toBe(100000)
    expect(res1.isEligible).toBe(true)

    // 2.00 ton -> kelebihan 2 ton
    const res2 = calculateTripIncentive({
      loadedTonnage: 31.0,
      unloadedTonnage: 33.0,
      additionalTonnageRate: 50000,
    })
    expect(res2.excessTonnage).toBe(2)
    expect(res2.incentivePaid).toBe(100000)
    expect(res2.isEligible).toBe(true)

    // 2.85 ton -> kelebihan 2 ton
    const res3 = calculateTripIncentive({
      loadedTonnage: 31.0,
      unloadedTonnage: 33.85,
      additionalTonnageRate: 50000,
    })
    expect(res3.excessTonnage).toBe(2)
    expect(res3.incentivePaid).toBe(100000)
    expect(res3.isEligible).toBe(true)
  })

  it("harus menghitung kelebihan 3 ton jika selisih > 2.85 ton", () => {
    // 2.86 ton -> kelebihan 3 ton
    const res1 = calculateTripIncentive({
      loadedTonnage: 31.0,
      unloadedTonnage: 33.86,
      additionalTonnageRate: 50000,
    })
    expect(res1.excessTonnage).toBe(3)
    expect(res1.incentivePaid).toBe(150000)
    expect(res1.isEligible).toBe(true)
  })

  it("harus menangani input string atau angka dengan aman", () => {
    const res = calculateTripIncentive({
      loadedTonnage: "31.00",
      unloadedTonnage: "32.90",
      additionalTonnageRate: "50000.00",
    })
    expect(res.excessTonnage).toBe(2) // 1.90 ton -> 2 ton
    expect(res.incentivePaid).toBe(100000)
  })

  it("Kasus 1: bongkaran 31.86 dapat 1 ton, sedangkan 31.85 tidak dapat", () => {
    // 31.85 ton terhadap basis 31 ton -> selisih 0.85 ton (belum dapat)
    const resTidakDapat = calculateTripIncentive({
      loadedTonnage: 31.0,
      unloadedTonnage: 31.85,
      additionalTonnageRate: 50000,
    })
    expect(resTidakDapat.excessTonnage).toBe(0)
    expect(resTidakDapat.incentivePaid).toBe(0)
    expect(resTidakDapat.isEligible).toBe(false)

    // 31.86 ton terhadap basis 31 ton -> selisih 0.86 ton (dapat 1 ton)
    const resDapat = calculateTripIncentive({
      loadedTonnage: 31.0,
      unloadedTonnage: 31.86,
      additionalTonnageRate: 50000,
    })
    expect(resDapat.excessTonnage).toBe(1)
    expect(resDapat.incentivePaid).toBe(50000)
    expect(resDapat.isEligible).toBe(true)
  })

  it("Kasus 2: muatan surat jalan 32 ton, bongkaran 31.86 ton dengan standar armada 31 ton tetap dapat insentif 1 ton", () => {
    // Surat muat pabrik tercatat 32 ton, tapi standar armada 31 ton.
    // Hasil timbangan bongkar 31.86 ton -> terhadap standar armada 31 ton, supir membawa 31.86 ton (+0.86 ton).
    // Supir berhak atas insentif 1 ton!
    const res = calculateTripIncentive({
      loadedTonnage: 32.0,
      unloadedTonnage: 31.86,
      standardTonnage: 31.0,
      additionalTonnageRate: 50000,
    })
    expect(res.baseTonnage).toBe(31.0)
    expect(res.tonnageDifference).toBe(0.86)
    expect(res.excessTonnage).toBe(1)
    expect(res.incentivePaid).toBe(50000)
    expect(res.isEligible).toBe(true)
  })
})
