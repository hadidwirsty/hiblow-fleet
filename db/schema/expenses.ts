import {
  date,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

import { trucks } from "./trucks"

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  truckId: varchar("truck_id", { length: 20 })
    .references(() => trucks.id)
    .notNull(),
  expenseDate: date("expense_date").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // Servis, Onderdil, GPS, DP/Cicilan, BBM, Admin Bank
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  adminFee: numeric("admin_fee", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  location: varchar("location", { length: 100 }), // Tuban, Kudus, Semarang
  repairNotes: text("repair_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type Expense = typeof expenses.$inferSelect
export type NewExpense = typeof expenses.$inferInsert
