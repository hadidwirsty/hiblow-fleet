import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

import { trucks } from "./trucks"

export const MAINTENANCE_REMINDER_TYPES = [
  "oil_change",
  "kir",
  "stnk",
  "other",
] as const

export type MaintenanceReminderType =
  (typeof MAINTENANCE_REMINDER_TYPES)[number]

export const maintenanceReminders = pgTable("maintenance_reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  truckId: varchar("truck_id", { length: 20 })
    .references(() => trucks.id)
    .notNull(),
  reminderType: varchar("reminder_type", {
    length: 20,
  })
    .$type<MaintenanceReminderType>()
    .notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  dueDate: date("due_date").notNull(),
  intervalDays: integer("interval_days"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type MaintenanceReminder = typeof maintenanceReminders.$inferSelect
export type NewMaintenanceReminder = typeof maintenanceReminders.$inferInsert
