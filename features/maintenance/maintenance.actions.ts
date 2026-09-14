"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { maintenanceReminders } from "@/db/schema"
import { assertAdmin } from "@/lib/rbac"
import { getCurrentSession } from "@/lib/session"

import {
  createReminderSchema,
  updateReminderSchema,
  type CreateReminderInput,
  type UpdateReminderInput,
} from "./maintenance.schema"

type ActionResult = { success: true } | { success: false; error: string }

export async function createReminder(
  input: CreateReminderInput
): Promise<ActionResult> {
  try {
    const session = await getCurrentSession()
    assertAdmin(session?.user)

    const data = createReminderSchema.parse(input)
    await db.insert(maintenanceReminders).values({
      truckId: data.truckId,
      reminderType: data.reminderType,
      label: data.label,
      dueDate: data.dueDate,
      intervalDays: data.intervalDays ?? null,
      notes: data.notes ?? null,
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menyimpan pengingat",
    }
  }
}

export async function updateReminder(
  input: UpdateReminderInput
): Promise<ActionResult> {
  try {
    const session = await getCurrentSession()
    assertAdmin(session?.user)

    const data = updateReminderSchema.parse(input)
    await db
      .update(maintenanceReminders)
      .set({
        label: data.label,
        dueDate: data.dueDate,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(maintenanceReminders.id, data.id))

    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui pengingat",
    }
  }
}

export async function deleteReminder(id: string): Promise<ActionResult> {
  try {
    const session = await getCurrentSession()
    assertAdmin(session?.user)

    await db
      .update(maintenanceReminders)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(maintenanceReminders.id, id))

    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menghapus pengingat",
    }
  }
}
