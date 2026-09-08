import { z } from "zod"

export const createTripSchema = z.object({
  truckId: z.enum(["W8187UA", "H8133OF"], {
    message: "Pilih unit truk yang valid (W8187UA / H8133OF)",
  }),
  orderNumber: z.number().int().positive({ message: "Nomor order harus > 0" }),
  orderDate: z.string().min(1, "Tanggal order wajib diisi"),
  unloadingDate: z.string().optional().nullable(),
  rateReferenceId: z.string().uuid().optional().nullable(),
  destinationCity: z.string().min(1, "Kota tujuan wajib diisi"),
  destinationName: z.string().min(1, "Nama tujuan wajib diisi"),
  ratePerTon: z
    .string()
    .refine((v) => parseFloat(v) > 0, "Tarif harus lebih dari 0"),
  loadedTonnage: z.string().optional().nullable(),
  unloadedTonnage: z
    .string()
    .refine((v) => parseFloat(v) > 0, "Tonase bongkar harus lebih dari 0"),
  omset: z.string().min(1, "Omset harus terhitung"),
  sangu: z.string().min(1, "Sangu harus terhitung"),
  incentiveRate: z.string().default("35000.00"),
  incentivePaid: z.string().default("0.00"),
  incentiveStatus: z.string().optional().nullable(),
  thirdPartyFee: z.string().default("0.00"),
  thirdPartyName: z.string().optional().nullable(),
  thirdPartyStatus: z.string().optional().nullable(),
  tax1Pct: z.string().default("0.00"),
  deduction2PctLju: z.string().default("0.00"),
  deduction5PctUjGrb: z.string().default("0.00"),
  mealAllowance: z.string().default("0.00"),
  savings: z.string().default("0.00"),
  claim: z.string().default("0.00"),
  claimDriver: z.string().default("0.00"),
  profit: z.string().min(1, "Laba ritase harus terhitung"),
  notes: z.string().optional().nullable(),
})

export type CreateTripInput = z.infer<typeof createTripSchema>

export const updateTripFeeStatusSchema = z.object({
  tripId: z.string().uuid("Trip ID harus berupa UUID yang valid"),
  thirdPartyStatus: z.string().optional().nullable(),
  incentiveStatus: z.string().optional().nullable(),
  thirdPartyFee: z.string().optional().nullable(),
  thirdPartyName: z.string().optional().nullable(),
  incentivePaid: z.string().optional().nullable(),
})

export type UpdateTripFeeStatusInput = z.infer<typeof updateTripFeeStatusSchema>
