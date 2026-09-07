"use server"

import { revalidatePath } from "next/cache"

import { eq } from "drizzle-orm"

import { db } from "@/db"
import { expenses } from "@/db/schema"
import { assertAdmin } from "@/lib/rbac"
import { getCurrentSession } from "@/lib/session"

import { createExpenseSchema, updateExpenseSchema } from "./expenses.schema"
import type { CreateExpenseInput, UpdateExpenseInput } from "./expenses.schema"

export async function createExpense(input: CreateExpenseInput) {
  try {
    const session = await getCurrentSession()
    if (process.env.NODE_ENV === "production") {
      if (!session?.user) {
        return {
          success: false as const,
          error: "Sesi telah berakhir. Silakan login kembali.",
        }
      }
      assertAdmin(session.user)
    }

    const parsed = createExpenseSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Validasi gagal",
      }
    }

    const [expense] = await db.insert(expenses).values(parsed.data).returning()
    revalidatePath("/expenses")

    return { success: true as const, expense }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat menyimpan pengeluaran"
    return { success: false as const, error: message }
  }
}

export async function updateExpense(input: UpdateExpenseInput) {
  try {
    const session = await getCurrentSession()
    if (process.env.NODE_ENV === "production") {
      if (!session?.user) {
        return {
          success: false as const,
          error: "Sesi telah berakhir. Silakan login kembali.",
        }
      }
      assertAdmin(session.user)
    }

    const parsed = updateExpenseSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Validasi gagal",
      }
    }

    const { id, ...data } = parsed.data
    const [expense] = await db
      .update(expenses)
      .set(data)
      .where(eq(expenses.id, id))
      .returning()

    if (!expense) {
      return {
        success: false as const,
        error: "Data pengeluaran tidak ditemukan",
      }
    }

    revalidatePath("/expenses")
    return { success: true as const, expense }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat memperbarui pengeluaran"
    return { success: false as const, error: message }
  }
}

export async function deleteExpense(id: string) {
  try {
    const session = await getCurrentSession()
    if (process.env.NODE_ENV === "production") {
      if (!session?.user) {
        return {
          success: false as const,
          error: "Sesi telah berakhir. Silakan login kembali.",
        }
      }
      assertAdmin(session.user)
    }

    if (!id) {
      return {
        success: false as const,
        error: "ID pengeluaran tidak valid",
      }
    }

    await db.delete(expenses).where(eq(expenses.id, id))
    revalidatePath("/expenses")

    return { success: true as const }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat menghapus pengeluaran"
    return { success: false as const, error: message }
  }
}
