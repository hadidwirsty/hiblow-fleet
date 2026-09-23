"use server"

import { revalidatePath } from "next/cache"

import { eq } from "drizzle-orm"

import { db } from "@/db"
import { trips } from "@/db/schema"
import { assertAdmin } from "@/lib/rbac"
import { getCurrentSession } from "@/lib/session"

import {
  createTripSchema,
  updateTripFeeStatusSchema,
  updateTripSchema,
} from "./trips.schema"
import type {
  CreateTripInput,
  UpdateTripFeeStatusInput,
  UpdateTripInput,
} from "./trips.schema"

export async function createTrip(input: CreateTripInput) {
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

    const parsed = createTripSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Validasi gagal",
      }
    }

    const effectiveUnloadedTonnage =
      parsed.data.unloadedTonnage && parseFloat(parsed.data.unloadedTonnage) > 0
        ? parsed.data.unloadedTonnage
        : parsed.data.loadedTonnage || "31.00"

    const insertValues = {
      ...parsed.data,
      unloadedTonnage: effectiveUnloadedTonnage,
    }

    const [trip] = await db.insert(trips).values(insertValues).returning()
    revalidatePath("/trips")

    return { success: true as const, trip }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat menyimpan ritase"
    return { success: false as const, error: message }
  }
}

export async function updateTripFeeStatus(input: UpdateTripFeeStatusInput) {
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

    const parsed = updateTripFeeStatusSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Validasi gagal",
      }
    }

    const { tripId, ...updateFields } = parsed.data
    const cleanUpdate: {
      thirdPartyStatus?: string | null
      incentiveStatus?: string | null
      thirdPartyFee?: string
      thirdPartyName?: string | null
      incentivePaid?: string
      updatedAt: Date
    } = {
      updatedAt: new Date(),
    }

    if (updateFields.thirdPartyStatus !== undefined) {
      cleanUpdate.thirdPartyStatus = updateFields.thirdPartyStatus
    }
    if (updateFields.incentiveStatus !== undefined) {
      cleanUpdate.incentiveStatus = updateFields.incentiveStatus
    }
    if (
      updateFields.thirdPartyFee !== undefined &&
      updateFields.thirdPartyFee !== null
    ) {
      cleanUpdate.thirdPartyFee = updateFields.thirdPartyFee
    }
    if (updateFields.thirdPartyName !== undefined) {
      cleanUpdate.thirdPartyName = updateFields.thirdPartyName
    }
    if (
      updateFields.incentivePaid !== undefined &&
      updateFields.incentivePaid !== null
    ) {
      cleanUpdate.incentivePaid = updateFields.incentivePaid
    }

    const [trip] = await db
      .update(trips)
      .set(cleanUpdate)
      .where(eq(trips.id, tripId))
      .returning()

    if (!trip) {
      return {
        success: false as const,
        error: "Data surat jalan tidak ditemukan",
      }
    }

    revalidatePath("/trips")
    return { success: true as const, trip }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat memperbarui status pembayaran"
    return { success: false as const, error: message }
  }
}

export async function updateTrip(input: UpdateTripInput) {
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

    const parsed = updateTripSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Validasi gagal",
      }
    }

    const { id, ...data } = parsed.data

    const effectiveUnloadedTonnage =
      data.unloadedTonnage && parseFloat(data.unloadedTonnage) > 0
        ? data.unloadedTonnage
        : data.loadedTonnage || "31.00"

    const updateValues = {
      ...data,
      unloadedTonnage: effectiveUnloadedTonnage,
      updatedAt: new Date(),
    }

    const [trip] = await db
      .update(trips)
      .set(updateValues)
      .where(eq(trips.id, id))
      .returning()

    if (!trip) {
      return {
        success: false as const,
        error: "Data surat jalan tidak ditemukan",
      }
    }

    revalidatePath("/trips")
    return { success: true as const, trip }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat memperbarui ritase"
    return { success: false as const, error: message }
  }
}

export async function deleteTrip(tripId: string) {
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

    if (!tripId || typeof tripId !== "string") {
      return {
        success: false as const,
        error: "ID ritase tidak valid",
      }
    }

    const [deleted] = await db
      .delete(trips)
      .where(eq(trips.id, tripId))
      .returning()

    if (!deleted) {
      return {
        success: false as const,
        error: "Data surat jalan tidak ditemukan",
      }
    }

    revalidatePath("/trips")
    return { success: true as const, trip: deleted }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat menghapus ritase"
    return { success: false as const, error: message }
  }
}
