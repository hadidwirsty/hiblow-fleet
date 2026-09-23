import { describe, expect, it } from "vitest"

import type { Trip } from "@/db/schema"
import { filterTrips } from "../trips.filter"

describe("trips.filter", () => {
  const sampleTrips: Trip[] = [
    {
      id: "t1",
      truckId: "W8187UA",
      orderNumber: "105",
      orderDate: "2025-06-10",
      unloadingDate: "2025-06-11",
      rateReferenceId: null,
      destinationCity: "REMBANG",
      destinationName: "ARIES PUTRA BETON",
      ratePerTon: "95000.00",
      loadedTonnage: "31.50",
      unloadedTonnage: "31.20",
      omset: "2964000.00",
      sangu: "1532000.00",
      incentiveRate: "35000.00",
      incentivePaid: "35000.00",
      incentiveStatus: "Lunas",
      thirdPartyFee: "50000.00",
      thirdPartyName: "Mas Mawan",
      thirdPartyStatus: "Lunas",
      tax1Pct: "0.00",
      deduction2PctLju: "0.00",
      deduction5PctUjGrb: "0.00",
      mealAllowance: "0.00",
      savings: "0.00",
      claim: "0.00",
      claimDriver: "0.00",
      profit: "1347000.00",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "t2",
      truckId: "H8133OF",
      orderNumber: "106",
      orderDate: "2025-07-01",
      unloadingDate: "2025-07-02",
      rateReferenceId: null,
      destinationCity: "SEMARANG",
      destinationName: "PT JAYA BETON",
      ratePerTon: "80000.00",
      loadedTonnage: "30.00",
      unloadedTonnage: "30.00",
      omset: "2400000.00",
      sangu: "1200000.00",
      incentiveRate: "35000.00",
      incentivePaid: "0.00",
      incentiveStatus: null,
      thirdPartyFee: "75000.00",
      thirdPartyName: "Mbah Man",
      thirdPartyStatus: "Belum Dibayar",
      tax1Pct: "0.00",
      deduction2PctLju: "0.00",
      deduction5PctUjGrb: "0.00",
      mealAllowance: "0.00",
      savings: "0.00",
      claim: "0.00",
      claimDriver: "0.00",
      profit: "1125000.00",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  it("filters trips by search term only across orderNumber and destinationCity", () => {
    expect(filterTrips(sampleTrips, { search: "105" })).toHaveLength(1)
    expect(filterTrips(sampleTrips, { search: "rembang" })).toHaveLength(1)
    expect(filterTrips(sampleTrips, { search: "semarang" })).toHaveLength(1)
    // Field lain tidak boleh menjadi sasaran pencarian
    expect(filterTrips(sampleTrips, { search: "jaya beton" })).toHaveLength(0)
    expect(filterTrips(sampleTrips, { search: "triyono" })).toHaveLength(0)
    expect(filterTrips(sampleTrips, { search: "khoirul" })).toHaveLength(0)
    expect(filterTrips(sampleTrips, { search: "mbah man" })).toHaveLength(0)
    expect(filterTrips(sampleTrips, { search: "surabaya" })).toHaveLength(0)
  })

  it("filters trips by specific date or date range from date picker", () => {
    // Single date filter
    expect(filterTrips(sampleTrips, { date: "2025-06-10" })).toHaveLength(1)
    expect(filterTrips(sampleTrips, { startDate: "2025-06-11" })).toHaveLength(
      1
    )
    expect(filterTrips(sampleTrips, { startDate: "2025-08-01" })).toHaveLength(
      0
    )

    // Range date filter
    expect(
      filterTrips(sampleTrips, {
        startDate: "2025-06-01",
        endDate: "2025-06-30",
      })
    ).toHaveLength(1)
    expect(
      filterTrips(sampleTrips, {
        startDate: "2025-06-01",
        endDate: "2025-07-31",
      })
    ).toHaveLength(2)
    expect(
      filterTrips(sampleTrips, {
        startDate: "2025-08-01",
        endDate: "2025-08-31",
      })
    ).toHaveLength(0)
  })

  it("filters trips by truckId, month, year, and DO fee status", () => {
    expect(filterTrips(sampleTrips, { truckId: "W8187UA" })).toHaveLength(1)
    expect(filterTrips(sampleTrips, { truckId: "ALL" })).toHaveLength(2)
    expect(filterTrips(sampleTrips, { month: "6" })).toHaveLength(1)
    expect(filterTrips(sampleTrips, { month: "ALL" })).toHaveLength(2)
    expect(filterTrips(sampleTrips, { year: "2025" })).toHaveLength(2)
    expect(filterTrips(sampleTrips, { year: "2026" })).toHaveLength(0)
    expect(filterTrips(sampleTrips, { feeFilter: "PENDING" })).toHaveLength(1)
    expect(filterTrips(sampleTrips, { feeFilter: "PAID" })).toHaveLength(1)
    expect(filterTrips(sampleTrips, { feeFilter: "ALL" })).toHaveLength(2)
  })

  it("handles empty search and default options cleanly", () => {
    expect(filterTrips(sampleTrips, {})).toHaveLength(2)
    expect(filterTrips(sampleTrips, { search: "   " })).toHaveLength(2)
  })
})
