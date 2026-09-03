# Implementasi Tahap 2: App Shell & Modul Ritase (`/trips`)

**Tanggal Dibuat:** 2026-09-03
**Sequence:** 2
**Target Stack:** Next.js 16 App Router · React 19 · shadcn/ui (base-nova) · Tailwind CSS v4 · Drizzle ORM · Zod + React Hook Form
**Dependency Sebelumnya:** Plan #1 (Foundation Layer) — Completed & Merged

---

## 1. Scope & Acceptance Criteria

### Acceptance Criteria (Definition of Done)
- [x] App Shell: Sidebar navigasi responsif (desktop/mobile) dengan branding HW Trans dan 5 nav links.
- [x] Halaman `/trips` menampilkan tabel seluruh 201 ritase historis dengan filter truk dan bulan/tahun.
- [x] Summary Bar: Total Ritase, Total Omset, Total Profit untuk filter yang aktif.
- [x] Form Modal "Input Ritase Baru" bisa dibuka dan ditutup.
- [x] Combobox Tujuan memfilter real-time dari `rate_references` (289 rute).
- [x] Saat Tujuan dipilih → Tarif/Ton, % Sangu, flag `hasSpecialDeductions` otomatis terisi.
- [x] Input Tonase Bongkar → Omset, Sangu, Profit kalkulasi live (reactive).
- [x] Server Action `createTrip` menyimpan data ke tabel `trips` dengan Zod validation + RBAC guard.
- [x] Toast sukses/gagal setelah submit, modal ditutup, daftar diperbarui.
- [x] `pnpm test` 36 PASS, `pnpm typecheck` 0 errors, `pnpm build` compiled successfully.

### Out of Scope
- Login page / auth flow (dibuat di Tahap 4).
- Fitur edit/hapus ritase.
- Export PDF/Excel.

---

## 2. Komponen shadcn/ui yang Diinstall

```bash
pnpm dlx shadcn@latest add sidebar dialog table select form input label command popover badge separator skeleton card sonner
```

---

## 3. Struktur Direktori Baru

```
app/
  (dashboard)/
    layout.tsx                          # [NEW] Route Group layout dengan AppSidebar
    dashboard/page.tsx                  # [NEW] Dashboard placeholder
    trips/
      page.tsx                          # [NEW] RSC: fetch & render trips
      loading.tsx                       # [NEW] Skeleton loading

components/
  app-shell/
    app-sidebar.tsx                     # [NEW] Client Component: sidebar + nav
    sidebar-nav-items.ts                # [NEW] Nav config (5 items)

features/
  trips/
    trips-table.tsx                     # [NEW] Client: tabel + filter URL
    trips-summary.tsx                   # [NEW] Server: 3 KPI cards
    trip-form-dialog.tsx                # [NEW] Client: modal + RHF + live calc
    trip-destination-combobox.tsx       # [NEW] Client: Popover + Command
    trips.actions.ts                    # [NEW] Server Action: createTrip
    trips.queries.ts                    # [NEW] DB queries: listTrips, etc
    trips.schema.ts                     # [NEW] Zod: createTripSchema

src/domain/__tests__/
  trips-schema.test.ts                  # [NEW] Unit test schema validation
  trip-form-calculations.test.ts        # [NEW] Integration test calculator
```

---

## 4. Task Atomik

### Task 1: Install shadcn/ui Components
**Files:** `components/ui/` (auto-generated)
**Acceptance Criteria:** 12 komponen berhasil diinstall tanpa TypeScript error.
**Verify:** `pnpm typecheck` → 0 errors.

---

### Task 2: Server Query Layer — `features/trips/trips.queries.ts`
**Files:**
- Create: `features/trips/trips.queries.ts`
- Create: `src/domain/__tests__/trips-queries.test.ts`

**Acceptance Criteria:**
1. `listTrips({ truckId?, month?, year? })` returns array sorted by `order_date DESC`.
2. `getRateReferences()` returns 289 active routes.
3. `getTripsSummary(filter)` returns `{ totalTrips, totalOmset, totalProfit }`.

**Step 1 — RED:**
```typescript
// src/domain/__tests__/trips-queries.test.ts
import { describe, it, expect, vi } from 'vitest'
vi.mock('@/src/db', () => ({
  db: { select: vi.fn().mockReturnThis(), from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockResolvedValue([]) }
}))
describe('listTrips', () => {
  it('returns empty array when no trips', async () => {
    const { listTrips } = await import('../../../features/trips/trips.queries')
    expect(Array.isArray(await listTrips({}))).toBe(true)
  })
})
```
**Step 2:** `pnpm test src/domain/__tests__/trips-queries.test.ts` → FAIL (module not found)

**Step 3 — GREEN:**
```typescript
// features/trips/trips.queries.ts
import { and, desc, eq, sql } from "drizzle-orm"

import { db } from "@/src/db"
import { rateReferences, trips } from "@/src/db/schema"

export interface ListTripsFilter {
  truckId?: string
  month?: number
  year?: number
}

export async function listTrips(filter: ListTripsFilter = {}) {
  const conditions = []
  if (filter.truckId) conditions.push(eq(trips.truckId, filter.truckId))
  if (filter.month && filter.year) {
    conditions.push(
      sql`EXTRACT(MONTH FROM ${trips.unloadingDate}) = ${filter.month}`,
      sql`EXTRACT(YEAR FROM ${trips.unloadingDate}) = ${filter.year}`
    )
  }
  return db
    .select()
    .from(trips)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(trips.orderDate))
}

export async function getRateReferences() {
  return db
    .select()
    .from(rateReferences)
    .where(eq(rateReferences.isActive, true))
    .orderBy(rateReferences.city, rateReferences.destination)
}

export interface TripsSummary {
  totalTrips: number
  totalOmset: number
  totalProfit: number
}

export async function getTripsSummary(
  filter: ListTripsFilter = {}
): Promise<TripsSummary> {
  const conditions = []
  if (filter.truckId) conditions.push(eq(trips.truckId, filter.truckId))
  if (filter.month && filter.year) {
    conditions.push(
      sql`EXTRACT(MONTH FROM ${trips.unloadingDate}) = ${filter.month}`,
      sql`EXTRACT(YEAR FROM ${trips.unloadingDate}) = ${filter.year}`
    )
  }
  const [result] = await db
    .select({
      totalTrips: sql<number>`count(*)::int`,
      totalOmset: sql<number>`coalesce(sum(${trips.omset}::numeric), 0)`,
      totalProfit: sql<number>`coalesce(sum(${trips.profit}::numeric), 0)`,
    })
    .from(trips)
    .where(conditions.length > 0 ? and(...conditions) : undefined)

  return result ?? { totalTrips: 0, totalOmset: 0, totalProfit: 0 }
}
```
**Step 4:** `pnpm test && pnpm typecheck` → 27+ PASS, 0 errors.

---

### Task 3: Zod Schema & Server Action

**Files:**
- Create: `features/trips/trips.schema.ts`
- Create: `features/trips/trips.actions.ts`
- Create: `src/domain/__tests__/trips-schema.test.ts`

**Acceptance Criteria:**
1. Schema rejects `unloadedTonnage <= 0`.
2. Schema rejects `ratePerTon <= 0`.
3. Server Action `createTrip` returns `{ success: true, trip }` on success.
4. Returns `{ success: false, error }` on validation failure.
5. Server Action calls `assertAdmin()` before insert.

**Step 1 — RED:**
```typescript
// src/domain/__tests__/trips-schema.test.ts
import { describe, it, expect } from 'vitest'
import { createTripSchema } from '../../../features/trips/trips.schema'

describe('createTripSchema', () => {
  it('rejects unloadedTonnage <= 0', () => {
    const result = createTripSchema.safeParse({
      truckId: 'W8187UA', orderDate: '2025-06-10',
      destinationCity: 'Tuban', destinationName: 'SI Tuban',
      ratePerTon: '95000', unloadedTonnage: '0',
      omset: '0', sangu: '0', profit: '0',
    })
    expect(result.success).toBe(false)
  })

  it('rejects ratePerTon <= 0', () => {
    const result = createTripSchema.safeParse({
      truckId: 'W8187UA', orderDate: '2025-06-10',
      destinationCity: 'Tuban', destinationName: 'SI Tuban',
      ratePerTon: '0', unloadedTonnage: '31',
      omset: '0', sangu: '0', profit: '0',
    })
    expect(result.success).toBe(false)
  })
})
```
**Step 2:** `pnpm test src/domain/__tests__/trips-schema.test.ts` → FAIL (module not found)

**Step 3 — GREEN:**
```typescript
// features/trips/trips.schema.ts
import { z } from "zod"

export const createTripSchema = z.object({
  truckId: z.enum(["W8187UA", "H8133OF"]),
  orderDate: z.string().min(1, "Tanggal order wajib diisi"),
  unloadingDate: z.string().optional().nullable(),
  rateReferenceId: z.string().uuid().optional().nullable(),
  destinationCity: z.string().min(1),
  destinationName: z.string().min(1),
  ratePerTon: z.string().refine((v) => parseFloat(v) > 0, "Tarif harus > 0"),
  loadedTonnage: z.string().optional().nullable(),
  unloadedTonnage: z.string().refine((v) => parseFloat(v) > 0, "Tonase bongkar harus > 0"),
  omset: z.string(),
  sangu: z.string(),
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
  profit: z.string(),
  notes: z.string().optional().nullable(),
})

export type CreateTripInput = z.infer<typeof createTripSchema>
```

```typescript
// features/trips/trips.actions.ts
"use server"

import { revalidatePath } from "next/cache"

import { db } from "@/src/db"
import { trips } from "@/src/db/schema"
import { assertAdmin } from "@/src/lib/rbac"
import { requireSession } from "@/src/lib/session"

import { createTripSchema } from "./trips.schema"
import type { CreateTripInput } from "./trips.schema"

export async function createTrip(input: CreateTripInput) {
  try {
    const session = await requireSession()
    await assertAdmin(session)

    const parsed = createTripSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false as const, error: parsed.error.errors[0].message }
    }

    const [trip] = await db.insert(trips).values(parsed.data).returning()
    revalidatePath("/trips")

    return { success: true as const, trip }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan ritase"
    return { success: false as const, error: message }
  }
}
```
**Step 4:** `pnpm test && pnpm typecheck` → 28+ PASS, 0 errors.

---

### Task 4: App Shell — Sidebar & Dashboard Layout

**Files:**
- Create: `components/app-shell/sidebar-nav-items.ts`
- Create: `components/app-shell/app-sidebar.tsx`
- Create: `app/(dashboard)/layout.tsx`
- Create: `app/(dashboard)/dashboard/page.tsx`

**Acceptance Criteria:**
1. Sidebar menampilkan branding "HW Trans Fleet" + 5 nav links dengan ikon Remixicon.
2. Active link mendapat highlight via `data-active` prop.
3. Mobile: toggle via SidebarTrigger di header.
4. Dark mode toggle di footer sidebar.

**Nav Config:**
```typescript
// components/app-shell/sidebar-nav-items.ts
export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "ri-dashboard-line" },
  { label: "Ritase", href: "/trips", icon: "ri-truck-line" },
  { label: "Pengeluaran", href: "/expenses", icon: "ri-receipt-line" },
  { label: "Bagi Hasil", href: "/profit-sharing", icon: "ri-hand-coin-line" },
  { label: "Ref. Tarif", href: "/rates", icon: "ri-table-2" },
] as const
```

**Key Pattern:**
```typescript
// app/(dashboard)/layout.tsx
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-shell/app-sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </SidebarProvider>
  )
}
```
**Verify:** `pnpm build` → Compiled successfully.

---

### Task 5: Halaman `/trips` — RSC Page + Loading Skeleton

**Files:**
- Create: `app/(dashboard)/trips/page.tsx`
- Create: `app/(dashboard)/trips/loading.tsx`

**Key Pattern:**
```typescript
// app/(dashboard)/trips/page.tsx
interface TripsPageProps {
  searchParams: Promise<{ truckId?: string; month?: string; year?: string }>
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const params = await searchParams
  const filter = {
    truckId: params.truckId,
    month: params.month ? parseInt(params.month) : undefined,
    year: params.year ? parseInt(params.year) : undefined,
  }
  const [tripsData, summary, rateRefs] = await Promise.all([
    listTrips(filter),
    getTripsSummary(filter),
    getRateReferences(),
  ])
  // ... render TripsSummary, TripsTable, TripFormDialog
}
```
**Verify:** `pnpm build` → 0 errors.

---

### Task 6: Summary Cards — `features/trips/trips-summary.tsx`

**Acceptance Criteria:** 3 KPI Cards (Total Ritase, Omset, Profit) menggunakan `formatCurrency()` dan shadcn `<Card>`.
**Type:** Server Component (tidak ada state/hook).

---

### Task 7: Tabel Ritase — `features/trips/trips-table.tsx`

**Acceptance Criteria:**
1. Kolom: No, Tgl Order, Tgl Bongkar, Truk, Tujuan, Tarif/Ton, Tonase, Omset, Sangu, Profit.
2. Filter Truk dan Bulan/Tahun mengubah URL search params.
3. Pagination 25 rows/page dengan state lokal.
**Type:** Client Component — `"use client"`.

---

### Task 8: Combobox Tujuan — `features/trips/trip-destination-combobox.tsx`

**Acceptance Criteria:**
1. Filter real-time dari 289 pilihan saat user mengetik.
2. `onSelect(rateRef)` dipanggil dengan objek rute lengkap.
3. Tampilan: `[KOTA] → [Nama Tujuan]`.
**Pattern:** `<Popover>` + `<Command>` dari shadcn/ui.

---

### Task 9: Form Modal Input Ritase — `features/trips/trip-form-dialog.tsx`

**Acceptance Criteria:**
1. Modal `<Dialog>` dengan RHF + `zodResolver(createTripSchema)`.
2. Pilih tujuan → auto-fill tarif, sangu%, `hasSpecialDeductions` via `setValue()`.
3. Ubah tonase → live reactive calculation via `calculateOmset()`, `calculateSangu()`, `calculateTripProfit()`.
4. Potongan khusus (Pajak 1%, LJU 2%, UJ GRB 5%) muncul otomatis jika `hasSpecialDeductions = true`.
5. Submit → `createTrip()` Server Action → toast sonner sukses/gagal.

**Step 1 — RED (Integration test kalkulasi):**
```typescript
// src/domain/__tests__/trip-form-calculations.test.ts
import { describe, it, expect } from 'vitest'
import { calculateOmset } from '../calculators/omset'
import { calculateSangu } from '../calculators/sangu'
import { calculateTripProfit } from '../calculators/trip-profit'

describe('Trip form live calculation', () => {
  it('calculates omset/sangu/profit for SI Tuban 31 ton', () => {
    const omset = calculateOmset({ ratePerTon: 95000, tonnage: 31.0 })
    const sangu = calculateSangu({ ratePerTon: 95000, tonnage: 31.0, sanguPercentage: 0.52 })
    const profit = calculateTripProfit({
      omset, sangu, thirdPartyFee: 0,
      tax1Pct: 0, deduction2PctLju: 0, deduction5PctUjGrb: 0,
    })
    expect(omset).toBe(2945000)
    expect(sangu).toBe(1531000)
    expect(profit).toBe(omset - sangu)
  })
})
```
**Step 4:** `pnpm test && pnpm typecheck && pnpm build` → 29+ PASS, 0 errors, compiled.

---

## 5. Urutan Eksekusi

| Batch | Tasks | Estimasi |
|---|---|---|
| **A** | Task 1 — Install shadcn/ui | 5 menit |
| **B** | Task 2 + 3 — Queries + Schema + Actions | 20 menit |
| **C** | Task 4 — App Shell Sidebar + Layout | 20 menit |
| **D** | Task 5 + 6 — RSC Page + Summary Cards | 15 menit |
| **E** | Task 7 — TripsTable | 20 menit |
| **F** | Task 8 + 9 — Combobox + Form Modal | 30 menit |

---

## 6. Rencana Verifikasi

```bash
pnpm test          # 29+ tests PASS
pnpm typecheck     # 0 errors
pnpm build         # Compiled successfully
pnpm dev           # Visual review http://localhost:3000/trips
```

**Manual Checklist:**
- [ ] Sidebar tampil dengan 5 nav links dan branding HW Trans Fleet
- [ ] `/trips` menampilkan tabel 201 ritase historis
- [ ] Filter Truk/Bulan mengubah URL dan memfilter data
- [ ] Tombol "Input Ritase Baru" membuka modal
- [ ] Combobox tujuan memfilter 289 rute secara real-time
- [ ] Pilih rute → tarif & sangu% otomatis terisi
- [ ] Ubah tonase → omset/sangu/profit kalkulasi live
- [ ] Submit → toast sukses, modal tutup, tabel refresh

---

## 7. Progress Tracking

- [x] **Task 1:** Install shadcn/ui components (sidebar, dialog, table, select, form, input, label, command, popover, badge, separator, skeleton, card, sonner)
- [x] **Task 2:** Server query layer (`features/trips/trips.queries.ts`)
- [x] **Task 3:** Zod schema + Server Action (`trips.schema.ts`, `trips.actions.ts`)
- [x] **Task 4:** App Shell — Sidebar + Route Group layout
- [x] **Task 5:** RSC Page `/trips` (`page.tsx`, `loading.tsx`)
- [x] **Task 6:** Summary Cards (`trips-summary.tsx`)
- [x] **Task 7:** Tabel Ritase client component (`trips-table.tsx`)
- [x] **Task 8:** Combobox Tujuan (`trip-destination-combobox.tsx`)
- [x] **Task 9:** Form Modal Input Ritase (`trip-form-dialog.tsx`)
