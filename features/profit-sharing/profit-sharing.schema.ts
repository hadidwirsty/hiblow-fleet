import { z } from "zod"

export const DEFAULT_FLEET_VALUATION = 580000000
export const DEFAULT_MANAGER_COMMISSION_RATE = 0.05

export const DEFAULT_PARTNERS = [
  { name: "Alfiah", capitalShare: 50000000 },
  { name: "Mas Dhian", capitalShare: 75000000 },
  { name: "Hadid", capitalShare: 4000000 },
] as const

export const partnerInputSchema = z.object({
  name: z.string().min(1, "Nama pemodal wajib diisi"),
  capitalShare: z
    .number({
      message: "Porsi modal harus berupa angka",
    })
    .positive("Porsi modal harus lebih dari 0"),
  partnerUserId: z.string().optional().nullable(),
})

export const createPeriodSchema = z
  .object({
    title: z.string().min(1, "Judul periode wajib diisi"),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal mulai harus YYYY-MM-DD"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal selesai harus YYYY-MM-DD"),
    managerCommissionRate: z
      .number({ message: "Persentase komisi harus berupa angka" })
      .min(0, "Komisi pengelola minimal 0%")
      .max(1, "Komisi pengelola maksimal 100%")
      .default(DEFAULT_MANAGER_COMMISSION_RATE),
    fleetValuation: z
      .number({ message: "Valuasi armada harus berupa angka" })
      .positive("Valuasi armada harus lebih dari 0")
      .default(DEFAULT_FLEET_VALUATION),
    partners: z
      .array(partnerInputSchema)
      .min(1, "Minimal harus menyertakan 1 pemodal"),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "Tanggal mulai tidak boleh melebihi tanggal selesai",
    path: ["endDate"],
  })

export const previewPeriodSchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal mulai harus YYYY-MM-DD"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal selesai harus YYYY-MM-DD"),
    managerCommissionRate: z
      .number()
      .min(0)
      .max(1)
      .default(DEFAULT_MANAGER_COMMISSION_RATE),
    fleetValuation: z.number().positive().default(DEFAULT_FLEET_VALUATION),
    partners: z.array(partnerInputSchema).default([...DEFAULT_PARTNERS]),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "Tanggal mulai tidak boleh melebihi tanggal selesai",
    path: ["endDate"],
  })

export type PartnerInput = z.infer<typeof partnerInputSchema>
export type CreatePeriodInput = z.infer<typeof createPeriodSchema>
export type PreviewPeriodInput = z.infer<typeof previewPeriodSchema>
