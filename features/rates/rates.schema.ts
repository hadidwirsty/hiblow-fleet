import { z } from "zod"

export const createRateReferenceSchema = z.object({
  originPlant: z
    .string()
    .trim()
    .min(1, "Nama pabrik asal tidak boleh kosong")
    .max(100, "Nama pabrik asal maksimal 100 karakter")
    .default("Semen Indonesia (SI) - Tuban"),
  clientName: z
    .string()
    .trim()
    .min(1, "Nama pabrik/klien tidak boleh kosong")
    .max(50, "Nama pabrik/klien maksimal 50 karakter"),
  city: z
    .string()
    .trim()
    .min(1, "Nama kota tidak boleh kosong")
    .max(100, "Nama kota maksimal 100 karakter"),
  destination: z
    .string()
    .trim()
    .min(1, "Nama tujuan pabrik tidak boleh kosong")
    .max(255, "Nama tujuan pabrik maksimal 255 karakter"),
  ratePerTon: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Tarif per ton harus berupa angka lebih dari 0",
    }),
  standardTonnage: z
    .string()
    .default("31.00")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Tonase standar harus berupa angka lebih dari 0",
    }),
  sanguPercentage: z.string().refine(
    (val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num > 0 && num < 1
    },
    {
      message: "Persentase sangu harus antara 0 dan 1 (contoh: 0.52 untuk 52%)",
    }
  ),
  defaultSangu: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      {
        message: "Acuan uang jalan harus berupa angka non-negatif",
      }
    ),
  additionalTonnageRate: z
    .string()
    .default("25000.00")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Tarif tonase tambahan tidak boleh negatif",
    }),
  hasSpecialDeductions: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export const updateRateReferenceSchema = z.object({
  id: z.string().uuid("ID tarif tidak valid"),
  originPlant: z
    .string()
    .trim()
    .min(1, "Nama pabrik asal tidak boleh kosong")
    .max(100, "Nama pabrik asal maksimal 100 karakter")
    .optional(),
  clientName: z
    .string()
    .trim()
    .min(1, "Nama pabrik/klien tidak boleh kosong")
    .max(50, "Nama pabrik/klien maksimal 50 karakter")
    .optional(),
  city: z
    .string()
    .trim()
    .min(1, "Nama kota tidak boleh kosong")
    .max(100, "Nama kota maksimal 100 karakter")
    .optional(),
  destination: z
    .string()
    .trim()
    .min(1, "Nama tujuan pabrik tidak boleh kosong")
    .max(255, "Nama tujuan pabrik maksimal 255 karakter")
    .optional(),
  ratePerTon: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Tarif per ton harus berupa angka lebih dari 0",
    })
    .optional(),
  standardTonnage: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Tonase standar harus berupa angka lebih dari 0",
    })
    .optional(),
  sanguPercentage: z
    .string()
    .refine(
      (val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num > 0 && num < 1
      },
      {
        message:
          "Persentase sangu harus antara 0 dan 1 (contoh: 0.52 untuk 52%)",
      }
    )
    .optional(),
  defaultSangu: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      {
        message: "Acuan uang jalan harus berupa angka non-negatif",
      }
    ),
  additionalTonnageRate: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Tarif tonase tambahan tidak boleh negatif",
    })
    .optional(),
  hasSpecialDeductions: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export const rateReferenceFilterSchema = z.object({
  search: z.string().optional(),
  originPlant: z.string().optional(),
  clientName: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
})

export type CreateRateReferenceInput = z.input<typeof createRateReferenceSchema>
export type CreateRateReferenceOutput = z.infer<
  typeof createRateReferenceSchema
>
export type UpdateRateReferenceInput = z.input<typeof updateRateReferenceSchema>
export type UpdateRateReferenceOutput = z.infer<
  typeof updateRateReferenceSchema
>
export type RateReferenceFilter = z.infer<typeof rateReferenceFilterSchema>
