import { describe, expect, it } from "vitest"

import {
  updateTripFeeStatusSchema,
  updateTripSchema,
} from "@/features/trips/trips.schema"
import {
  deleteTrip,
  updateTrip,
  updateTripFeeStatus,
} from "@/features/trips/trips.actions"

describe("trips fee schema & actions", () => {
  describe("updateTripFeeStatusSchema", () => {
    it("should accept valid payload with UUID and status fields", () => {
      const validPayload = {
        tripId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        thirdPartyStatus: "Sudah dibayar 25 Jun 25 5rit",
        incentiveStatus: "Lunas",
        thirdPartyFee: "50000.00",
        thirdPartyName: "Mas Mawan",
      }

      const result = updateTripFeeStatusSchema.safeParse(validPayload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.thirdPartyStatus).toBe(
          "Sudah dibayar 25 Jun 25 5rit"
        )
      }
    })

    it("should reject invalid tripId that is not a UUID", () => {
      const invalidPayload = {
        tripId: "not-a-uuid",
        thirdPartyStatus: "Lunas",
      }

      const result = updateTripFeeStatusSchema.safeParse(invalidPayload)
      expect(result.success).toBe(false)
    })
  })

  describe("updateTripSchema", () => {
    it("should accept valid payload with UUID and trip fields", () => {
      const validPayload = {
        id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        truckId: "W8187UA" as const,
        orderNumber: 10,
        orderDate: "2026-09-23",
        destinationCity: "SEMARANG",
        destinationName: "PROYEK TOL",
        ratePerTon: "110000",
        omset: "3410000",
        sangu: "1705000",
        profit: "1705000",
      }

      const result = updateTripSchema.safeParse(validPayload)
      expect(result.success).toBe(true)
    })

    it("should reject payload without valid UUID id", () => {
      const invalidPayload = {
        id: "not-a-uuid",
        truckId: "W8187UA" as const,
        orderNumber: 10,
        orderDate: "2026-09-23",
        destinationCity: "SEMARANG",
        destinationName: "PROYEK TOL",
        ratePerTon: "110000",
        omset: "3410000",
        sangu: "1705000",
        profit: "1705000",
      }

      const result = updateTripSchema.safeParse(invalidPayload)
      expect(result.success).toBe(false)
    })
  })

  describe("updateTrip & deleteTrip server actions", () => {
    it("should return validation error when updateTripFeeStatus receives invalid payload", async () => {
      const res = await updateTripFeeStatus({
        tripId: "invalid-id",
        thirdPartyStatus: "Lunas",
      })

      expect(res.success).toBe(false)
      expect(res.error).toBeDefined()
    })

    it("should return validation error when updateTrip receives invalid payload", async () => {
      const res = await updateTrip({
        id: "not-uuid",
        truckId: "W8187UA",
        orderNumber: "1",
        orderDate: "",
        destinationCity: "",
        destinationName: "",
        ratePerTon: "0",
        omset: "",
        sangu: "",
        profit: "",
      } as unknown as Parameters<typeof updateTrip>[0])

      expect(res.success).toBe(false)
      expect(res.error).toBeDefined()
    })

    it("should return error when deleteTrip receives empty tripId", async () => {
      const res = await deleteTrip("")

      expect(res.success).toBe(false)
      expect(res.error).toBeDefined()
    })
  })
})
