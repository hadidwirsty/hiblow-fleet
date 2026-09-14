import { describe, expect, it } from "vitest"

import { computeReminderStatus, getDaysUntilDue } from "@/domain/maintenance"

describe("getDaysUntilDue", () => {
  it("returns negative number for overdue dates", () => {
    const today = new Date("2026-09-11")
    const dueDate = "2026-09-01"
    expect(getDaysUntilDue(dueDate, today)).toBeLessThan(0)
  })

  it("returns 0 for due today", () => {
    const today = new Date("2026-09-11")
    const dueDate = "2026-09-11"
    expect(getDaysUntilDue(dueDate, today)).toBe(0)
  })

  it("returns positive number for future dates", () => {
    const today = new Date("2026-09-11")
    const dueDate = "2026-10-11"
    expect(getDaysUntilDue(dueDate, today)).toBe(30)
  })
})

describe("computeReminderStatus", () => {
  it("returns 'overdue' when dueDate is in the past", () => {
    const today = new Date("2026-09-11")
    expect(computeReminderStatus("2026-09-01", today)).toBe("overdue")
  })

  it("returns 'due_soon' when dueDate is today", () => {
    const today = new Date("2026-09-11")
    expect(computeReminderStatus("2026-09-11", today)).toBe("due_soon")
  })

  it("returns 'due_soon' when dueDate is within 30 days", () => {
    const today = new Date("2026-09-11")
    expect(computeReminderStatus("2026-10-01", today)).toBe("due_soon")
  })

  it("returns 'ok' when dueDate is more than 30 days away", () => {
    const today = new Date("2026-09-11")
    expect(computeReminderStatus("2026-11-01", today)).toBe("ok")
  })

  it("returns 'due_soon' exactly at 30-day boundary", () => {
    const today = new Date("2026-09-11")
    expect(computeReminderStatus("2026-10-11", today)).toBe("due_soon")
  })
})
