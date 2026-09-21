import {
  boolean,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const rateReferences = pgTable("rate_references", {
  id: uuid("id").defaultRandom().primaryKey(),
  originPlant: varchar("origin_plant", { length: 100 })
    .default("Semen Indonesia (SI) - Tuban")
    .notNull(),
  clientName: varchar("client_name", { length: 50 }).notNull(), // 'SI', 'SBI', 'Indocement Grobogan'
  city: varchar("city", { length: 100 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  ratePerTon: numeric("rate_per_ton", { precision: 12, scale: 2 }).notNull(),
  standardTonnage: numeric("standard_tonnage", { precision: 6, scale: 2 })
    .default("31.00")
    .notNull(),
  sanguPercentage: numeric("sangu_percentage", {
    precision: 5,
    scale: 4,
  }).notNull(), // 0.5200 = 52%
  defaultSangu: numeric("default_sangu", { precision: 14, scale: 2 }),
  additionalTonnageRate: numeric("additional_tonnage_rate", {
    precision: 12,
    scale: 2,
  })
    .default("25000.00")
    .notNull(),
  hasSpecialDeductions: boolean("has_special_deductions")
    .default(false)
    .notNull(), // true for Grobogan/LJU
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type RateReference = typeof rateReferences.$inferSelect
export type NewRateReference = typeof rateReferences.$inferInsert
