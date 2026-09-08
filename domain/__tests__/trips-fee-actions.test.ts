import { describe, expect, it } from "vitest"

import { updateTripFeeStatusSchema } from "@/features/trips/trips.schema"
import { updateTripFeeStatus } from "@/features/trips/trips.actions"

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

  describe("updateTripFeeStatus server action", () => {
    it("should return validation error for invalid tripId", async () => {
      const res = await updateTripFeeStatus({
        tripId: "invalid-id",
        thirdPartyStatus: "Lunas",
      })

      expect(res.success).toBe(false)
      expect(res.error).toBeDefined()
    })
  })
})
