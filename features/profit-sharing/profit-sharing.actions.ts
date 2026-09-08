"use server"

import { revalidatePath } from "next/cache"

import { eq } from "drizzle-orm"

import { db } from "@/db"
import { profitShares, profitSharingPeriods } from "@/db/schema"
import { calculateProfitSharing } from "@/domain/calculators/profit-sharing"
import { assertAdmin } from "@/lib/rbac"
import { getCurrentSession } from "@/lib/session"

import {
  getExpensesForPeriod,
  getIncomeForPeriod,
} from "./profit-sharing.queries"
import {
  createPeriodSchema,
  previewPeriodSchema,
} from "./profit-sharing.schema"
import type {
  CreatePeriodInput,
  PreviewPeriodInput,
} from "./profit-sharing.schema"

/**
 * Melakukan preview kalkulasi bagi hasil berdasarkan data transaksi riil di DB.
 */
export async function previewPeriodCalculation(input: PreviewPeriodInput) {
  try {
    const parsed = previewPeriodSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Validasi gagal",
      }
    }

    const {
      startDate,
      endDate,
      managerCommissionRate,
      fleetValuation,
      partners,
    } = parsed.data

    const [totalIncome, totalExpenses] = await Promise.all([
      getIncomeForPeriod(startDate, endDate),
      getExpensesForPeriod(startDate, endDate, "DP/Cicilan"),
    ])

    const calculation = calculateProfitSharing({
      totalIncome,
      totalExpenses,
      managerCommissionRate,
      fleetValuation,
      partners: partners.map((p) => ({
        name: p.name,
        capitalShare: p.capitalShare,
        partnerUserId: p.partnerUserId ?? undefined,
      })),
    })

    return {
      success: true as const,
      totalIncome,
      totalExpenses,
      calculation,
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat menghitung preview bagi hasil"
    return { success: false as const, error: message }
  }
}

/**
 * Menyimpan periode bagi hasil baru ke database (tutup buku).
 */
export async function createProfitSharingPeriod(input: CreatePeriodInput) {
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

    const parsed = createPeriodSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Validasi gagal",
      }
    }

    const {
      title,
      startDate,
      endDate,
      managerCommissionRate,
      fleetValuation,
      partners,
    } = parsed.data

    const [totalIncome, totalExpenses] = await Promise.all([
      getIncomeForPeriod(startDate, endDate),
      getExpensesForPeriod(startDate, endDate, "DP/Cicilan"),
    ])

    const calc = calculateProfitSharing({
      totalIncome,
      totalExpenses,
      managerCommissionRate,
      fleetValuation,
      partners: partners.map((p) => ({
        name: p.name,
        capitalShare: p.capitalShare,
        partnerUserId: p.partnerUserId ?? undefined,
      })),
    })

    const period = await db.transaction(async (tx) => {
      const [insertedPeriod] = await tx
        .insert(profitSharingPeriods)
        .values({
          title,
          startDate,
          endDate,
          totalIncome: totalIncome.toFixed(2),
          totalExpenses: totalExpenses.toFixed(2),
          grossBalance: calc.grossBalance.toFixed(2),
          managerCommissionRate: calc.managerCommissionRate.toFixed(4),
          managerCommissionAmount: calc.managerCommissionAmount.toFixed(2),
          distributableProfit: calc.distributableProfit.toFixed(2),
          fleetValuation: calc.fleetValuation.toFixed(2),
          managerProfit: calc.managerProfit.toFixed(2),
          managerTakeHome: calc.managerTakeHome.toFixed(2),
          status: "draft",
        })
        .returning()

      if (calc.partnerShares.length > 0) {
        await tx.insert(profitShares).values(
          calc.partnerShares.map((ps) => ({
            periodId: insertedPeriod.id,
            partnerName: ps.name,
            partnerUserId: ps.partnerUserId ?? null,
            capitalShare: ps.capitalShare.toFixed(2),
            sharePercentage: ps.sharePercentage.toFixed(6),
            payoutAmount: ps.payoutAmount.toFixed(2),
          }))
        )
      }

      return insertedPeriod
    })

    revalidatePath("/profit-sharing")
    return { success: true as const, period }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat menyimpan periode bagi hasil"
    return { success: false as const, error: message }
  }
}

/**
 * Menghapus satu periode bagi hasil (termasuk pembagian pemodal via cascade).
 */
export async function deleteProfitSharingPeriod(id: string) {
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
        error: "ID periode tidak valid",
      }
    }

    await db.delete(profitSharingPeriods).where(eq(profitSharingPeriods.id, id))

    revalidatePath("/profit-sharing")
    return { success: true as const }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat menghapus periode bagi hasil"
    return { success: false as const, error: message }
  }
}

/**
 * Memperbarui status periode bagi hasil ('draft' | 'finalized').
 */
export async function updateProfitSharingStatus(
  id: string,
  status: "draft" | "finalized"
) {
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

    await db
      .update(profitSharingPeriods)
      .set({ status })
      .where(eq(profitSharingPeriods.id, id))

    revalidatePath("/profit-sharing")
    return { success: true as const }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat memperbarui status periode"
    return { success: false as const, error: message }
  }
}
