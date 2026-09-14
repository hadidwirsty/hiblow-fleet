import { z } from "zod"

import { MAINTENANCE_REMINDER_TYPES } from "@/db/schema"

export const createReminderSchema = z.object({
  truckId: z.enum(["W8187UA", "H8133OF"]),
  reminderType: z.enum(MAINTENANCE_REMINDER_TYPES),
  label: z.string().min(1, "Label wajib diisi"),
  dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
  intervalDays: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updateReminderSchema = createReminderSchema
  .pick({ dueDate: true, notes: true, label: true })
  .extend({ id: z.string().uuid() })

export type CreateReminderInput = z.infer<typeof createReminderSchema>
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>
