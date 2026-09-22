import { describe, expect, it } from "vitest"

import { createTripSchema } from "@/features/trips/trips.schema"

describe("createTripSchema", () => {
  it("rejects unloadedTonnage <= 0", () => {
    const result = createTripSchema.safeParse({
      truckId: "W8187UA",
      orderNumber: 1,
      orderDate: "2025-06-10",
      destinationCity: "Tuban",
      destinationName: "SI Tuban",
      ratePerTon: "95000",
      unloadedTonnage: "0",
      omset: "0",
      sangu: "0",
      profit: "0",
    })
    expect(result.success).toBe(false)
  })

  it("rejects ratePerTon <= 0", () => {
    const result = createTripSchema.safeParse({
      truckId: "W8187UA",
      orderNumber: 1,
      orderDate: "2025-06-10",
      destinationCity: "Tuban",
      destinationName: "SI Tuban",
      ratePerTon: "0",
      unloadedTonnage: "31",
      omset: "0",
      sangu: "0",
      profit: "0",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid truckId", () => {
    const result = createTripSchema.safeParse({
      truckId: "B1234XYZ",
      orderNumber: 1,
      orderDate: "2025-06-10",
      destinationCity: "Tuban",
      destinationName: "SI Tuban",
      ratePerTon: "95000",
      unloadedTonnage: "31",
      omset: "2945000",
      sangu: "1531000",
      profit: "1414000",
    })
    expect(result.success).toBe(false)
  })

  it("accepts valid trip data with optional fields default", () => {
    const result = createTripSchema.safeParse({
      truckId: "W8187UA",
      orderNumber: 10,
      orderDate: "2025-06-10",
      destinationCity: "Tuban",
      destinationName: "SI Tuban",
      ratePerTon: "95000.00",
      unloadedTonnage: "31.00",
      omset: "2945000.00",
      sangu: "1531000.00",
      profit: "1414000.00",
    })
    expect(result.success).toBe(true)
  })
})
