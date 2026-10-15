import { describe, expect, it } from "vitest"

import { formatWithholdingReceiptDisplay } from "@/features/trips/trip-detail-sheet"

describe("formatWithholdingReceiptDisplay", () => {
  it("formats withholding number and date when both are present", () => {
    const text = formatWithholdingReceiptDisplay(
      "BP-SI-2026-00123",
      "2026-10-14"
    )
    expect(text).toContain("BP-SI-2026-00123")
    expect(text).toContain("14 Okt 2026")
  })

  it("formats withholding number alone when date is missing", () => {
    const text = formatWithholdingReceiptDisplay("BP-SI-2026-00123", null)
    expect(text).toBe("BP-SI-2026-00123")
  })

  it("returns default placeholder when withholding number is missing", () => {
    const text = formatWithholdingReceiptDisplay(null, null)
    expect(text).toBe("Belum diinput")
  })
})
