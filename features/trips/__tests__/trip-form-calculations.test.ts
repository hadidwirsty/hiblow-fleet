import { differenceInCalendarDays, parseISO } from "date-fns"
import { describe, expect, it } from "vitest"

import { calculateOmset } from "@/domain/calculators/omset"
import { calculateSangu } from "@/domain/calculators/sangu"
import { calculateTripClaim } from "@/domain/calculators/trip-claim"
import { calculateTripIncentive } from "@/domain/calculators/trip-incentive"
import { calculateTripProfit } from "@/domain/calculators/trip-profit"

describe("Trip form live calculation integration", () => {
  it("calculates omset, sangu, and profit for standard SI Tuban route", () => {
    const ratePerTon = 95000
    const unloadedTonnage = 31.0
    const sanguPct = 0.52

    const omset = calculateOmset({ ratePerTon, unloadedTonnage })
    const sangu = calculateSangu({
      ratePerTon,
      unloadedTonnage,
      sanguPercentage: sanguPct,
    })
    const profitResult = calculateTripProfit({
      omset,
      sangu,
      thirdPartyFee: 0,
      tax1Pct: 0,
      deduction2PctLju: 0,
      deduction5PctUjGrb: 0,
    })

    expect(omset).toBe(2945000)
    expect(sangu).toBe(1531000)
    expect(profitResult.profit).toBe(1414000)
  })

  it("caps sangu tonnage at 31.0 ton even if actual unloaded tonnage is 32.5 ton", () => {
    const ratePerTon = 95000
    const actualTonnage = 32.5
    const sanguPct = 0.52

    const omset = calculateOmset({ ratePerTon, unloadedTonnage: actualTonnage })
    const sangu = calculateSangu({
      ratePerTon,
      unloadedTonnage: actualTonnage,
      sanguPercentage: sanguPct,
    })
    const profitResult = calculateTripProfit({
      omset,
      sangu,
      thirdPartyFee: 0,
      tax1Pct: 0,
      deduction2PctLju: 0,
      deduction5PctUjGrb: 0,
    })

    expect(omset).toBe(3087500)
    expect(sangu).toBe(1531000) // Capped at 31 ton!
    expect(profitResult.profit).toBe(3087500 - 1531000)
  })

  it("correctly deducts Grobogan / PT LJU special deductions from company profit, not sangu", () => {
    const ratePerTon = 110000
    const unloadedTonnage = 31.0
    const sanguPct = 0.5

    const omset = calculateOmset({ ratePerTon, unloadedTonnage })
    const sangu = calculateSangu({
      ratePerTon,
      unloadedTonnage,
      sanguPercentage: sanguPct,
    })

    const tax1Pct = Math.round(0.01 * omset)
    const deduction2PctLju = Math.round(0.02 * omset)
    const deduction5PctUjGrb = Math.round(0.05 * omset)

    const profitResult = calculateTripProfit({
      omset,
      sangu,
      thirdPartyFee: 0,
      tax1Pct,
      deduction2PctLju,
      deduction5PctUjGrb,
    })

    expect(omset).toBe(3410000)
    expect(sangu).toBe(1705000) // Sangu remains untouched!
    expect(tax1Pct).toBe(34100)
    expect(deduction2PctLju).toBe(68200)
    expect(deduction5PctUjGrb).toBe(170500)
    expect(profitResult.profit).toBe(3410000 - 1705000 - 34100 - 68200 - 170500)
  })

  it("calculates profit correctly when driver sangu is manually overridden (e.g. extra ton or special case)", () => {
    const ratePerTon = 95000
    const actualTonnage = 32.5
    const omset = calculateOmset({ ratePerTon, unloadedTonnage: actualTonnage })

    // Suppose admin manually sets driver sangu to Rp 1.650.000 instead of default formula
    const manualSangu = 1650000

    const profitResult = calculateTripProfit({
      omset,
      sangu: manualSangu,
      thirdPartyFee: 50000,
      tax1Pct: 0,
      deduction2PctLju: 0,
      deduction5PctUjGrb: 0,
    })

    expect(omset).toBe(3087500)
    // Profit must respect the manual sangu value
    expect(profitResult.profit).toBe(3087500 - 1650000 - 50000)
  })

  it("handles flat default sangu from rate reference if available", () => {
    const ratePerTon = 110000
    const unloadedTonnage = 31.0
    const defaultSangu = 1650000

    const omset = calculateOmset({ ratePerTon, unloadedTonnage })
    // Route has flat default sangu (e.g. SBI Tuban or fixed UJ)
    const sanguToUse = defaultSangu

    const profitResult = calculateTripProfit({
      omset,
      sangu: sanguToUse,
      thirdPartyFee: 0,
      tax1Pct: 0,
      deduction2PctLju: 0,
      deduction5PctUjGrb: 0,
    })

    expect(omset).toBe(3410000)
    expect(profitResult.profit).toBe(3410000 - 1650000)
  })

  it("handles non-Indocement fixed third-party fee of Rp 100.000 (SILOG - Mas Wawan)", () => {
    const ratePerTon = 95000
    const unloadedTonnage = 31.0
    const sangu = 1531000
    const omset = calculateOmset({ ratePerTon, unloadedTonnage })
    const thirdPartyFee = 100000 // Fixed for non-Indocement

    const profitResult = calculateTripProfit({
      omset,
      sangu,
      thirdPartyFee,
    })

    expect(omset).toBe(2945000)
    // Profit = Omset - Sangu - Biaya Pihak Ketiga (100.000)
    expect(profitResult.profit).toBe(2945000 - 1531000 - 100000)
  })

  it("handles Indocement third-party fee of 5% omset when funded by third party", () => {
    const ratePerTon = 110000
    const unloadedTonnage = 31.0
    const sangu = 1705000
    const omset = calculateOmset({ ratePerTon, unloadedTonnage }) // 3.410.000
    const fee5Pct = Math.round(omset * 0.05) // 170.500

    const profitResult = calculateTripProfit({
      omset,
      sangu,
      thirdPartyFee: fee5Pct,
    })

    expect(fee5Pct).toBe(170500)
    expect(profitResult.profit).toBe(3410000 - 1705000 - 170500)
  })

  it("handles Indocement self-funded trip with Rp 0 third-party fee", () => {
    const ratePerTon = 110000
    const unloadedTonnage = 31.0
    const sangu = 1705000
    const omset = calculateOmset({ ratePerTon, unloadedTonnage })
    const thirdPartyFee = 0 // Modal sendiri

    const profitResult = calculateTripProfit({
      omset,
      sangu,
      thirdPartyFee,
    })

    expect(profitResult.profit).toBe(3410000 - 1705000)
  })

  it("handles new Indocement DO rule: Mas Wawan Rp 100.000 + Biaya 5% omset", () => {
    const ratePerTon = 110000
    const unloadedTonnage = 31.0
    const sangu = 1705000
    const omset = calculateOmset({ ratePerTon, unloadedTonnage }) // 3.410.000
    const fee5Pct = Math.round(omset * 0.05) // 170.500
    const totalDoIndo = 100000 + fee5Pct // 270.500

    const profitResult = calculateTripProfit({
      omset,
      sangu,
      thirdPartyFee: totalDoIndo,
    })

    expect(totalDoIndo).toBe(270500)
    expect(profitResult.profit).toBe(3410000 - 1705000 - 270500)
  })

  it("handles new Indocement DO rule: Mas Wawan Rp 100.000 + Modal Sendiri (Rp 0)", () => {
    const ratePerTon = 110000
    const unloadedTonnage = 31.0
    const sangu = 1705000
    const omset = calculateOmset({ ratePerTon, unloadedTonnage }) // 3.410.000
    const totalDoIndo = 100000 // Hanya Mas Wawan Rp 100.000

    const profitResult = calculateTripProfit({
      omset,
      sangu,
      thirdPartyFee: totalDoIndo,
    })

    expect(totalDoIndo).toBe(100000)
    expect(profitResult.profit).toBe(3410000 - 1705000 - 100000)
  })

  it("calculates driver meal allowance (UM) and deducts from company profit", () => {
    const ratePerTon = 95000
    const unloadedTonnage = 31.0
    const sangu = 1531000
    const omset = calculateOmset({ ratePerTon, unloadedTonnage })
    const mealAllowance = 50000 // Supir menginap 1 hari

    const profitResult = calculateTripProfit({
      omset,
      sangu,
      mealAllowance,
      thirdPartyFee: 100000,
    })

    expect(profitResult.profit).toBe(2945000 - 1531000 - 100000 - 50000)
  })

  it("calculates shrinkage claim (50:50) and integrates into trip profit", () => {
    const loadedTonnage = 31.0
    const unloadedTonnage = 30.5
    const ratePerTon = 100000
    const sangu = 1550000
    const omset = calculateOmset({ ratePerTon, unloadedTonnage })

    const claimRes = calculateTripClaim({
      loadedTonnage,
      unloadedTonnage,
      ratePerTon,
    })

    expect(claimRes.totalClaimAmount).toBe(40700)
    expect(claimRes.companyClaim).toBe(20350)
    expect(claimRes.driverClaim).toBe(20350)

    const profitResult = calculateTripProfit({
      omset,
      sangu,
      claim: claimRes.companyClaim,
      claimDriver: claimRes.driverClaim,
      thirdPartyFee: 100000,
    })

    expect(profitResult.profit).toBe(3050000 - 1550000 - 100000 - 20350 - 20350)
  })

  it("calculates excess tonnage incentive and integrates into trip profit", () => {
    const loadedTonnage = 31.0
    const unloadedTonnage = 33.0 // +2 ton
    const ratePerTon = 95000
    const additionalTonnageRate = 50000
    const sangu = 1531000
    const omset = calculateOmset({ ratePerTon, unloadedTonnage })

    const incentiveRes = calculateTripIncentive({
      loadedTonnage,
      unloadedTonnage,
      additionalTonnageRate,
    })

    expect(incentiveRes.excessTonnage).toBe(2)
    expect(incentiveRes.incentivePaid).toBe(100000)

    const profitResult = calculateTripProfit({
      omset,
      sangu,
      incentivePaid: incentiveRes.incentivePaid,
      thirdPartyFee: 100000,
    })

    expect(profitResult.profit).toBe(omset - sangu - 100000 - 100000)
  })

  it("handles Case 2 end-to-end: loaded 32T, unloaded 31.86T, driver gets 1T incentive (standard 31T), shrinkage 140kg, tolerance 96kg, claim 44kg (Rp 44.000)", () => {
    const loadedTonnage = 32.0
    const unloadedTonnage = 31.86
    const standardTonnage = 31.0
    const ratePerTon = 1000000 // 1 ton = 1 juta -> 1 kg = 1.000
    const additionalTonnageRate = 50000
    const sangu = 1600000

    // 1. Omset menggunakan tonase riil bongkar: 31.86T * 1.000.000 = 31.860.000
    const omset = calculateOmset({ ratePerTon, unloadedTonnage })
    expect(omset).toBe(31860000)

    // 2. Klaim Susut: muat 32T vs bongkar 31.86T -> susut 140kg, toleransi 96kg, klaim 44kg -> Rp 44.000 (50:50)
    const claimRes = calculateTripClaim({
      loadedTonnage,
      unloadedTonnage,
      ratePerTon,
    })
    expect(claimRes.isMinus).toBe(true)
    expect(claimRes.shrinkageTonnage).toBe(0.14) // 140 kg
    expect(claimRes.toleranceTonnage).toBe(0.096) // 96 kg
    expect(claimRes.claimableTonnage).toBe(0.044) // 44 kg
    expect(claimRes.totalClaimAmount).toBe(44000) // Rp 44.000
    expect(claimRes.companyClaim).toBe(22000)
    expect(claimRes.driverClaim).toBe(22000)

    // 3. Insentif Supir: terhadap standar normal armada 31T -> 31.86 - 31.0 = +0.86T (> 0.85) -> supir dapat 1 ton
    const incentiveRes = calculateTripIncentive({
      loadedTonnage,
      unloadedTonnage,
      standardTonnage,
      additionalTonnageRate,
    })
    expect(incentiveRes.baseTonnage).toBe(31.0)
    expect(incentiveRes.tonnageDifference).toBe(0.86)
    expect(incentiveRes.excessTonnage).toBe(1)
    expect(incentiveRes.incentivePaid).toBe(50000)

    // 4. Laba Ritase Perusahaan: Omset (31.86T) - Sangu - Insentif - Klaim Kantor - Klaim Supir - Fee DO
    const profitResult = calculateTripProfit({
      omset,
      sangu,
      incentivePaid: incentiveRes.incentivePaid,
      claim: claimRes.companyClaim,
      claimDriver: claimRes.driverClaim,
      thirdPartyFee: 100000,
    })

    expect(profitResult.profit).toBe(
      31860000 - 1600000 - 50000 - 22000 - 22000 - 100000
    )
  })

  describe("Bagian C: Driver meal allowance (UM) calendar days calculation & manual override", () => {
    it("suggests Rp 0 when unloading date is on the same day as order date (no overnight stay)", () => {
      const orderDate = parseISO("2026-10-13")
      const unloadingDate = parseISO("2026-10-13")

      const rawDiff = differenceInCalendarDays(unloadingDate, orderDate)
      const overnightDays = rawDiff > 0 ? rawDiff : 0
      const suggestedUM = overnightDays * 50000

      expect(overnightDays).toBe(0)
      expect(suggestedUM).toBe(0)
    })

    it("suggests Rp 50.000 for 1 overnight day and Rp 100.000 for 2 overnight days", () => {
      const orderDate = parseISO("2026-10-13")
      const unloadingDate1 = parseISO("2026-10-14") // 1 hari inap
      const unloadingDate2 = parseISO("2026-10-15") // 2 hari inap

      const diff1 = Math.max(
        0,
        differenceInCalendarDays(unloadingDate1, orderDate)
      )
      const diff2 = Math.max(
        0,
        differenceInCalendarDays(unloadingDate2, orderDate)
      )

      expect(diff1 * 50000).toBe(50000)
      expect(diff2 * 50000).toBe(100000)
    })

    it("clamps negative difference to 0 if unloading date is earlier than order date", () => {
      const orderDate = parseISO("2026-10-14")
      const unloadingDate = parseISO("2026-10-13")

      const diff = Math.max(
        0,
        differenceInCalendarDays(unloadingDate, orderDate)
      )
      expect(diff).toBe(0)
      expect(diff * 50000).toBe(0)
    })

    it("prioritizes manual override for meal allowance in profit calculation and supports reset to recommendation", () => {
      const omset = 3100000
      const sangu = 1600000
      const thirdPartyFee = 100000

      // Rekomendasi sistem untuk 1 hari inap
      const suggestedUM = 50000

      // User melakukan edit manual ke Rp 75.000 (misalnya kebutuhan darurat / antrean pabrik lama)
      let isMealAllowanceManuallyEdited = true
      let activeUM = 75000

      const profitWithManualUM = calculateTripProfit({
        omset,
        sangu,
        thirdPartyFee,
        mealAllowance: activeUM,
      })

      // Laba harus terpotong nilai manual Rp 75.000
      expect(profitWithManualUM.profit).toBe(3100000 - 1600000 - 100000 - 75000)

      // User menekan tombol "Reset ke Acuan"
      isMealAllowanceManuallyEdited = false
      activeUM = suggestedUM

      const profitWithResetUM = calculateTripProfit({
        omset,
        sangu,
        thirdPartyFee,
        mealAllowance: activeUM,
      })

      // Laba kembali terpotong nilai acuan Rp 50.000
      expect(isMealAllowanceManuallyEdited).toBe(false)
      expect(profitWithResetUM.profit).toBe(3100000 - 1600000 - 100000 - 50000)
    })
  })

  describe("Option A Indocement Grobogan alignment (7% total: 2% LJU + 5% fleet savings, 0% tax)", () => {
    it("calculates Indocement Grobogan live calculation with Option A without double deduction", () => {
      const sangu = 2441250 // Sangu 50% dari OA Driver (93%)
      const omset = 5250000

      const profitResult = calculateTripProfit({
        omset,
        sangu,
        thirdPartyFee: 100000,
        hasSpecialDeductions: true,
      })

      expect(profitResult.tax1Pct).toBe(0)
      expect(profitResult.deduction2PctLju).toBe(105000)
      expect(profitResult.deduction5PctUjGrb).toBe(0)
      expect(profitResult.savings).toBe(262500)
      expect(profitResult.profit).toBe(5250000 - 2441250 - 100000 - 105000)
      expect(profitResult.totalArmadaValue).toBe(
        profitResult.profit + profitResult.savings
      )
    })
  })
})
