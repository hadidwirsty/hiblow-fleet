"use server"

import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { trips } from "@/db/schema"
import { assertAdmin } from "@/lib/rbac"
import { getCurrentSession } from "@/lib/session"

import { createTripSchema } from "./trips.schema"
import type { CreateTripInput } from "./trips.schema"

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

    const [trip] = await db.insert(trips).values(parsed.data).returning()
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
