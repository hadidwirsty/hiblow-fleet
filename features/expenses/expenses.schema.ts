import { z } from "zod"

export const EXPENSE_CATEGORIES = [
  "Servis",
  "Onderdil",
  "BBM",
  "GPS",
  "DP/Cicilan",
  "Administrasi",
  "Lainnya",
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const createExpenseSchema = z.object({
  truckId: z.enum(["W8187UA", "H8133OF"], {
    message: "Pilih unit truk yang valid (W8187UA / H8133OF)",
  }),
  expenseDate: z.string().min(1, "Tanggal pengeluaran wajib diisi"),
  category: z.enum(EXPENSE_CATEGORIES, {
    message: "Pilih kategori pengeluaran yang valid",
  }),
  description: z.string().min(1, "Deskripsi pengeluaran wajib diisi"),
  amount: z
    .string()
    .min(1, "Nominal harus diisi")
    .refine((v) => {
      const parsed = parseFloat(v)
      return !isNaN(parsed) && parsed > 0
    }, "Nominal harus lebih dari 0"),
  adminFee: z
    .string()
    .refine((v) => {
      if (!v) return true
      const parsed = parseFloat(v)
      return !isNaN(parsed) && parsed >= 0
    }, "Biaya admin tidak valid")
    .default("0.00"),
  location: z.string().optional().nullable(),
  repairNotes: z.string().optional().nullable(),
})

export const updateExpenseSchema = createExpenseSchema.extend({
  id: z.string().uuid("ID pengeluaran tidak valid"),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
