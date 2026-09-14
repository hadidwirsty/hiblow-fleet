import { asc, eq } from "drizzle-orm"

import { db } from "@/db"
import { maintenanceReminders } from "@/db/schema"
import type { MaintenanceReminder } from "@/db/schema"

export async function getActiveReminders(): Promise<MaintenanceReminder[]> {
  return db
    .select()
    .from(maintenanceReminders)
    .where(eq(maintenanceReminders.isActive, true))
    .orderBy(asc(maintenanceReminders.dueDate))
}
