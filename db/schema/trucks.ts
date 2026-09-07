import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core"

export const trucks = pgTable("trucks", {
  id: varchar("id", { length: 20 }).primaryKey(), // 'W8187UA', 'H8133OF'
  plateNumber: varchar("plate_number", { length: 20 }).notNull(),
  brandModel: varchar("brand_model", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type Truck = typeof trucks.$inferSelect
export type NewTruck = typeof trucks.$inferInsert
