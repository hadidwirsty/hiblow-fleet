"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/db"
import { rateReferences, trips } from "@/db/schema"
import { assertAdmin } from "@/lib/rbac"
import { getCurrentSession } from "@/lib/session"

import {
  createRateReferenceSchema,
  updateRateReferenceSchema,
} from "./rates.schema"
import type {
  CreateRateReferenceInput,
  UpdateRateReferenceInput,
} from "./rates.schema"

const uuidSchema = z.string().uuid("ID tarif tidak valid")

async function verifyAdminAuth() {
  const session = await getCurrentSession()
  if (process.env.NODE_ENV === "production") {
    if (!session?.user) {
      throw new Error("Sesi telah berakhir. Silakan login kembali.")
    }
    assertAdmin(session.user)
  }
}

export async function createRateReference(input: CreateRateReferenceInput) {
  try {
    await verifyAdminAuth()

    const parsed = createRateReferenceSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Validasi gagal",
      }
    }

    const [rate] = await db
      .insert(rateReferences)
      .values(parsed.data)
      .returning()

    revalidatePath("/rates")
    return { success: true as const, rate }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat menyimpan referensi tarif"
    return { success: false as const, error: message }
  }
}

export async function updateRateReference(input: UpdateRateReferenceInput) {
  try {
    await verifyAdminAuth()

    const parsed = updateRateReferenceSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Validasi gagal",
      }
    }

    const { id, ...dataToUpdate } = parsed.data

    const [rate] = await db
      .update(rateReferences)
      .set(dataToUpdate)
      .where(eq(rateReferences.id, id))
      .returning()

    if (!rate) {
      return {
        success: false as const,
        error: "Referensi tarif tidak ditemukan",
      }
    }

    revalidatePath("/rates")
    return { success: true as const, rate }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat memperbarui referensi tarif"
    return { success: false as const, error: message }
  }
}

export async function toggleRateReferenceStatus(id: string, isActive: boolean) {
  try {
    await verifyAdminAuth()

    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) {
      return {
        success: false as const,
        error: parsedId.error.issues[0]?.message ?? "ID tidak valid",
      }
    }

    const [rate] = await db
      .update(rateReferences)
      .set({ isActive })
      .where(eq(rateReferences.id, parsedId.data))
      .returning()

    if (!rate) {
      return {
        success: false as const,
        error: "Referensi tarif tidak ditemukan",
      }
    }

    revalidatePath("/rates")
    return { success: true as const, rate }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat mengubah status tarif"
    return { success: false as const, error: message }
  }
}

export async function deleteRateReference(id: string) {
  try {
    await verifyAdminAuth()

    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) {
      return {
        success: false as const,
        error: parsedId.error.issues[0]?.message ?? "ID tidak valid",
      }
    }

    // Periksa apakah tarif sudah digunakan pada transaksi ritase
    const usedInTrips = await db
      .select({ id: trips.id })
      .from(trips)
      .where(eq(trips.rateReferenceId, parsedId.data))
      .limit(1)

    if (usedInTrips.length > 0) {
      return {
        success: false as const,
        error:
          "Tarif ini tidak dapat dihapus karena sudah tercatat dalam riwayat ritase truk. Silakan nonaktifkan statusnya.",
      }
    }

    const [deleted] = await db
      .delete(rateReferences)
      .where(eq(rateReferences.id, parsedId.data))
      .returning()

    if (!deleted) {
      return {
        success: false as const,
        error: "Referensi tarif tidak ditemukan",
      }
    }

    revalidatePath("/rates")
    return { success: true as const, id: deleted.id }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat menghapus tarif"
    return { success: false as const, error: message }
  }
}
