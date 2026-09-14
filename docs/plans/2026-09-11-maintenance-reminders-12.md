# Plan #12: Pengingat Servis Rutin & Jatuh Tempo Uji KIR/STNK Truk

**Tanggal:** 2026-09-11
**Fitur:** Maintenance Reminders — Servis Rutin & KIR/STNK Alert (Docs 02 No. 3.1 — Could Have)
**Status:** Completed (Executed on 2026-09-14)

---

## Ringkasan Fitur

Menambahkan **widget pengingat jatuh tempo** di halaman `/dashboard` untuk dua jenis jadwal kritis armada:

1. **Servis Rutin / Ganti Oli** — pengingat berulang berbasis selang waktu (misal: setiap 3 bulan atau 10.000 km).
2. **Pajak STNK & Uji KIR** — pengingat berbasis tanggal jatuh tempo tahunan.

Widget menampilkan status tiap pengingat dengan indikator visual:
- 🔴 **Lewat Jatuh Tempo** (`overdue`) — sudah melewati tanggal/jadwal
- 🟡 **Mendekat** (`due_soon`) — jatuh tempo dalam 30 hari ke depan
- 🟢 **Aman** (`ok`) — lebih dari 30 hari ke depan

**Pendekatan Implementasi:**
Data jadwal disimpan di tabel baru `maintenance_reminders` (CRUD sederhana oleh Admin). Widget di dashboard hanya membaca dan menghitung status urgency. Investor tidak melihat widget ini (hanya admin).

---

## Gap Analysis

| Komponen | Status | Task |
|---|---|---|
| Tabel DB `maintenance_reminders` + schema Drizzle | ✅ Selesai | Task 1 |
| Migrasi SQL + schema sync | ✅ Selesai | Task 1 |
| Zod schema + Server Actions CRUD reminder | ✅ Selesai | Task 2 |
| Pure function `computeReminderStatus(reminder, today)` | ✅ Selesai | Task 3 |
| Query `getActiveReminders()` | ✅ Selesai | Task 4 |
| Widget `MaintenanceRemindersWidget` + `ReminderBadge` di dashboard | ✅ Selesai | Task 5 |
| Integrasi widget ke `dashboard/page.tsx` | ✅ Selesai | Task 6 |


---

## Batasan Arsitektur (Technical Constitution)

- **DB Migration:** Plan ini memerlukan **1 migrasi baru** (`maintenance_reminders` table). Jalankan `pnpm dlx drizzle-kit generate && pnpm dlx drizzle-kit migrate` setelah Task 1.
- **Testability-First:** `computeReminderStatus()` adalah **pure function** dengan `today` sebagai parameter yang diinjeksi — testable 100% tanpa Date mock.
- **Security:** Server Actions untuk CRUD reminder menggunakan `assertAdmin()` — hanya admin yang bisa mengelola jadwal.
- **Admin-Only Widget:** Widget hanya ditampilkan di halaman admin dashboard. `PartnerProfitSharingView` tidak terpengaruh.
- **No GPS/Odometer Integration:** Pengingat servis berbasis **tanggal** (bukan kilometer), sesuai scope `01-scope-dan-non-goals.md`.

---

## Task 1: Skema DB — Tabel `maintenance_reminders`

**Files:**
- Create: `db/schema/maintenance.ts`
- Modify: `db/schema/index.ts`
- Migration: Jalankan `pnpm dlx drizzle-kit generate` setelah selesai.

**Acceptance Criteria:**
1. Tabel `maintenance_reminders` berisi kolom: `id`, `truckId`, `reminderType`, `label`, `dueDate`, `intervalDays`, `notes`, `isActive`, `createdAt`, `updatedAt`.
2. `reminderType` enum: `"oil_change"` | `"kir"` | `"stnk"` | `"other"`.
3. `dueDate` adalah tanggal jatuh tempo berikutnya (diperbarui manual oleh Admin setiap kali servis/uji selesai).
4. `intervalDays` opsional (untuk menampilkan info "setiap X hari") — tidak digunakan untuk kalkulasi otomatis.
5. Foreign key ke `trucks.id`.

**Step 3: Write implementation (GREEN)**

```typescript
// db/schema/maintenance.ts
import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

import { trucks } from "./trucks"

export const MAINTENANCE_REMINDER_TYPES = [
  "oil_change",
  "kir",
  "stnk",
  "other",
] as const

export type MaintenanceReminderType =
  (typeof MAINTENANCE_REMINDER_TYPES)[number]

export const maintenanceReminders = pgTable("maintenance_reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  truckId: varchar("truck_id", { length: 20 })
    .references(() => trucks.id)
    .notNull(),
  reminderType: varchar("reminder_type", {
    length: 20,
  }).$type<MaintenanceReminderType>().notNull(),
  label: varchar("label", { length: 100 }).notNull(), // "Ganti Oli Mesin", "Uji KIR", "Pajak STNK"
  dueDate: date("due_date").notNull(),
  intervalDays: integer("interval_days"), // Opsional: setiap berapa hari (90, 365, dll)
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type MaintenanceReminder = typeof maintenanceReminders.$inferSelect
export type NewMaintenanceReminder = typeof maintenanceReminders.$inferInsert
```

Tambahkan ke `db/schema/index.ts`:
```typescript
export * from "./maintenance"
```

**Step 4: Verify**
```bash
pnpm dlx drizzle-kit generate
pnpm dlx drizzle-kit migrate
pnpm exec tsc --noEmit
```
Expected: Migrasi berhasil, 0 TypeScript error.

---

## Task 2: Zod Schema & Server Actions CRUD Reminder

**Files:**
- Create: `features/maintenance/maintenance.schema.ts`
- Create: `features/maintenance/maintenance.actions.ts`
- Test: `domain/__tests__/maintenance-actions.test.ts`

**Acceptance Criteria:**
1. `createReminderSchema` memvalidasi: `truckId`, `reminderType`, `label`, `dueDate` (format YYYY-MM-DD), `intervalDays?`, `notes?`.
2. `createReminder(input)` — Server Action, assertAdmin, insert ke DB, revalidatePath `/dashboard`.
3. `updateReminder(input)` — Server Action, assertAdmin, update `dueDate` & `notes` & `updatedAt`, revalidatePath `/dashboard`.
4. `deleteReminder(id)` — Server Action, assertAdmin, soft-delete via `isActive = false`.
5. Semua action mengembalikan `{ success: true } | { success: false; error: string }`.

**Step 1: Write failing test (RED)**

Buat `domain/__tests__/maintenance-actions.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/session", () => ({
  getCurrentSession: vi.fn().mockResolvedValue({
    user: { id: "admin-1", role: "admin", name: "Mas Hafidz" },
  }),
}))

describe("maintenance.actions", () => {
  beforeEach(() => vi.clearAllMocks())

  it("createReminder harus mengembalikan success: true untuk admin", async () => {
    const { createReminder } = await import(
      "@/features/maintenance/maintenance.actions"
    )
    const result = await createReminder({
      truckId: "W8187UA",
      reminderType: "oil_change",
      label: "Ganti Oli Mesin",
      dueDate: "2026-10-01",
      intervalDays: 90,
    })
    expect(result.success).toBe(true)
  })

  it("deleteReminder harus mengembalikan success: true untuk admin", async () => {
    const { deleteReminder } = await import(
      "@/features/maintenance/maintenance.actions"
    )
    const result = await deleteReminder("reminder-uuid-1")
    expect(result.success).toBe(true)
  })
})
```

**Step 2: Verify test fails**
```bash
pnpm test domain/__tests__/maintenance-actions.test.ts
```
Expected: FAIL — `Cannot find module '@/features/maintenance/maintenance.actions'`

**Step 3: Write minimal implementation (GREEN)**

```typescript
// features/maintenance/maintenance.schema.ts
import { z } from "zod"
import { MAINTENANCE_REMINDER_TYPES } from "@/db/schema"

export const createReminderSchema = z.object({
  truckId: z.enum(["W8187UA", "H8133OF"]),
  reminderType: z.enum(MAINTENANCE_REMINDER_TYPES),
  label: z.string().min(1, "Label wajib diisi"),
  dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
  intervalDays: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updateReminderSchema = createReminderSchema
  .pick({ dueDate: true, notes: true, label: true })
  .extend({ id: z.string().uuid() })

export type CreateReminderInput = z.infer<typeof createReminderSchema>
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>
```

```typescript
// features/maintenance/maintenance.actions.ts
"use server"

import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { maintenanceReminders } from "@/db/schema"
import { assertAdmin } from "@/lib/rbac"
import { getCurrentSession } from "@/lib/session"

import {
  createReminderSchema,
  type CreateReminderInput,
  updateReminderSchema,
  type UpdateReminderInput,
} from "./maintenance.schema"
import { eq } from "drizzle-orm"

type ActionResult = { success: true } | { success: false; error: string }

export async function createReminder(
  input: CreateReminderInput
): Promise<ActionResult> {
  try {
    const session = await getCurrentSession()
    assertAdmin(session?.user)

    const data = createReminderSchema.parse(input)
    await db.insert(maintenanceReminders).values({
      truckId: data.truckId,
      reminderType: data.reminderType,
      label: data.label,
      dueDate: data.dueDate,
      intervalDays: data.intervalDays ?? null,
      notes: data.notes ?? null,
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menyimpan pengingat",
    }
  }
}

export async function updateReminder(
  input: UpdateReminderInput
): Promise<ActionResult> {
  try {
    const session = await getCurrentSession()
    assertAdmin(session?.user)

    const data = updateReminderSchema.parse(input)
    await db
      .update(maintenanceReminders)
      .set({
        label: data.label,
        dueDate: data.dueDate,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(maintenanceReminders.id, data.id))

    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui pengingat",
    }
  }
}

export async function deleteReminder(id: string): Promise<ActionResult> {
  try {
    const session = await getCurrentSession()
    assertAdmin(session?.user)

    await db
      .update(maintenanceReminders)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(maintenanceReminders.id, id))

    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal menghapus pengingat",
    }
  }
}
```

**Step 4: Verify test passes**
```bash
pnpm test domain/__tests__/maintenance-actions.test.ts
```
Expected: PASS — 2/2 tests hijau

---

## Task 3: Pure Function — `computeReminderStatus()`

**Files:**
- Create: `domain/maintenance.ts`
- Test: `domain/__tests__/maintenance.test.ts`

**Acceptance Criteria:**
1. `computeReminderStatus(dueDate, today)` → `"overdue" | "due_soon" | "ok"`.
   - `"overdue"`: `dueDate < today`
   - `"due_soon"`: `0 <= (dueDate - today) <= 30 hari`
   - `"ok"`: `(dueDate - today) > 30 hari`
2. `getDaysUntilDue(dueDate, today)` → `number` (negatif = sudah lewat).
3. Kedua fungsi menerima `today` sebagai parameter (**tidak** memanggil `new Date()` internal) — testable tanpa manipulasi global.

**Step 1: Write failing test (RED)**

Buat `domain/__tests__/maintenance.test.ts`:

```typescript
import { describe, expect, it } from "vitest"

import {
  computeReminderStatus,
  getDaysUntilDue,
} from "@/domain/maintenance"

describe("getDaysUntilDue", () => {
  it("returns negative number for overdue dates", () => {
    const today = new Date("2026-09-11")
    const dueDate = "2026-09-01"
    expect(getDaysUntilDue(dueDate, today)).toBeLessThan(0)
  })

  it("returns 0 for due today", () => {
    const today = new Date("2026-09-11")
    const dueDate = "2026-09-11"
    expect(getDaysUntilDue(dueDate, today)).toBe(0)
  })

  it("returns positive number for future dates", () => {
    const today = new Date("2026-09-11")
    const dueDate = "2026-10-11"
    expect(getDaysUntilDue(dueDate, today)).toBe(30)
  })
})

describe("computeReminderStatus", () => {
  it("returns 'overdue' when dueDate is in the past", () => {
    const today = new Date("2026-09-11")
    expect(computeReminderStatus("2026-09-01", today)).toBe("overdue")
  })

  it("returns 'due_soon' when dueDate is today", () => {
    const today = new Date("2026-09-11")
    expect(computeReminderStatus("2026-09-11", today)).toBe("due_soon")
  })

  it("returns 'due_soon' when dueDate is within 30 days", () => {
    const today = new Date("2026-09-11")
    expect(computeReminderStatus("2026-10-01", today)).toBe("due_soon")
  })

  it("returns 'ok' when dueDate is more than 30 days away", () => {
    const today = new Date("2026-09-11")
    expect(computeReminderStatus("2026-11-01", today)).toBe("ok")
  })

  it("returns 'due_soon' exactly at 30-day boundary", () => {
    const today = new Date("2026-09-11")
    expect(computeReminderStatus("2026-10-11", today)).toBe("due_soon")
  })
})
```

**Step 2: Verify test fails**
```bash
pnpm test domain/__tests__/maintenance.test.ts
```
Expected: FAIL — `Cannot find module '@/domain/maintenance'`

**Step 3: Write minimal implementation (GREEN)**

```typescript
// domain/maintenance.ts

const DUE_SOON_THRESHOLD_DAYS = 30
const MS_PER_DAY = 1000 * 60 * 60 * 24

export type ReminderStatus = "overdue" | "due_soon" | "ok"

/**
 * Calculates days until the due date from today.
 * Returns negative if overdue, 0 if due today, positive if future.
 * Pure function — `today` is injected as parameter.
 */
export function getDaysUntilDue(dueDate: string, today: Date): number {
  const due = new Date(dueDate)
  // Normalize to midnight UTC to avoid time-of-day drift
  const todayMidnight = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  )
  const dueMidnight = new Date(
    Date.UTC(due.getFullYear(), due.getMonth(), due.getDate())
  )
  return Math.round((dueMidnight.getTime() - todayMidnight.getTime()) / MS_PER_DAY)
}

/**
 * Computes urgency status for a maintenance reminder.
 * Pure function — `today` is injected as parameter.
 *
 * @returns "overdue"  — past due date
 * @returns "due_soon" — within 30 days (inclusive)
 * @returns "ok"       — more than 30 days away
 */
export function computeReminderStatus(
  dueDate: string,
  today: Date
): ReminderStatus {
  const daysUntil = getDaysUntilDue(dueDate, today)
  if (daysUntil < 0) return "overdue"
  if (daysUntil <= DUE_SOON_THRESHOLD_DAYS) return "due_soon"
  return "ok"
}
```

**Step 4: Verify test passes**
```bash
pnpm test domain/__tests__/maintenance.test.ts
```
Expected: PASS — 8/8 tests hijau

---

## Task 4: Query `getActiveReminders()`

**Files:**
- Create: `features/maintenance/maintenance.queries.ts`
- Test: `domain/__tests__/maintenance-actions.test.ts` (extend)

**Acceptance Criteria:**
1. `getActiveReminders()` → `MaintenanceReminder[]` hanya yang `isActive = true`, diurutkan berdasarkan `dueDate ASC` (yang paling dekat jatuh tempo tampil pertama).
2. Mengembalikan array kosong jika tidak ada data.

**Step 3: Write implementation (GREEN)**

```typescript
// features/maintenance/maintenance.queries.ts
import { asc, eq } from "drizzle-orm"

import { db } from "@/db"
import { maintenanceReminders } from "@/db/schema"
import type { MaintenanceReminder } from "@/db/schema"

export async function getActiveReminders(): Promise<MaintenanceReminder[]> {
  return db
    .select()
    .from(maintenanceReminders)
    .where(eq(maintenanceReminders.isActive, true))
    .orderBy(asc(maintenanceReminders.dueDate))
}
```

**Step 4: Verify**
```bash
pnpm exec tsc --noEmit
```
Expected: 0 error

---

## Task 5: Komponen Widget — `MaintenanceRemindersWidget`

**Files:**
- Create: `features/maintenance/maintenance-reminders-widget.tsx`

**Acceptance Criteria:**
1. Menerima props: `reminders: MaintenanceReminder[]`.
2. Untuk setiap reminder, tampilkan:
   - Label (misal "Ganti Oli Mesin - W8187UA")
   - Tanggal jatuh tempo (format Indonesia)
   - Badge status dengan warna sesuai urgency: merah (`overdue`), kuning (`due_soon`), hijau (`ok`)
   - Jumlah hari ("X hari lagi" / "Lewat X hari")
3. Empty-state jika tidak ada reminder aktif: "Belum ada jadwal servis yang dikonfigurasi."
4. Badge jumlah reminder `overdue` + `due_soon` di header card (angka peringatan).
5. Komponen adalah `"use client"` untuk dapat memanggil `computeReminderStatus` dengan `new Date()` di sisi client.

**Catatan Penting — Client Date vs Server Date:**
`computeReminderStatus` diimport dan dipanggil di client (`"use client"`) dengan `new Date()` agar tanggal yang digunakan adalah waktu browser pengguna (bukan waktu build server). Ini adalah satu-satunya penggunaan `new Date()` yang diperbolehkan karena bukan logika finansial.

**Step 3: Write implementation (GREEN)**

```typescript
// features/maintenance/maintenance-reminders-widget.tsx
"use client"

import { RiAlarmWarningLine, RiCheckLine, RiTimeLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import type { MaintenanceReminder } from "@/db/schema"
import {
  computeReminderStatus,
  getDaysUntilDue,
  type ReminderStatus,
} from "@/domain/maintenance"
import { formatDateIndonesian } from "@/lib/utils"

interface MaintenanceRemindersWidgetProps {
  reminders: MaintenanceReminder[]
}

const STATUS_CONFIG: Record<
  ReminderStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  overdue: {
    label: "Lewat Jatuh Tempo",
    className:
      "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    icon: <RiAlarmWarningLine className="size-3" />,
  },
  due_soon: {
    label: "Mendekat",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: <RiTimeLine className="size-3" />,
  },
  ok: {
    label: "Aman",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: <RiCheckLine className="size-3" />,
  },
}

const TYPE_LABELS: Record<string, string> = {
  oil_change: "Ganti Oli",
  kir: "Uji KIR",
  stnk: "Pajak STNK",
  other: "Lainnya",
}

export function MaintenanceRemindersWidget({
  reminders,
}: MaintenanceRemindersWidgetProps) {
  const today = new Date()

  const remindersWithStatus = reminders.map((r) => ({
    ...r,
    status: computeReminderStatus(r.dueDate, today),
    daysUntil: getDaysUntilDue(r.dueDate, today),
  }))

  const urgentCount = remindersWithStatus.filter(
    (r) => r.status === "overdue" || r.status === "due_soon"
  ).length

  if (reminders.length === 0) {
    return (
      <div className="flex h-30 items-center justify-center rounded-xl border border-dashed">
        <p className="text-sm text-muted-foreground">
          Belum ada jadwal servis yang dikonfigurasi
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {urgentCount > 0 && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          <RiAlarmWarningLine className="size-3.5" />
          {urgentCount} item memerlukan perhatian segera
        </p>
      )}

      <div className="divide-y divide-border rounded-xl border overflow-hidden">
        {remindersWithStatus.map((reminder) => {
          const config = STATUS_CONFIG[reminder.status]
          const daysText =
            reminder.daysUntil < 0
              ? `Lewat ${Math.abs(reminder.daysUntil)} hari`
              : reminder.daysUntil === 0
                ? "Hari ini!"
                : `${reminder.daysUntil} hari lagi`

          return (
            <div
              key={reminder.id}
              className="flex items-center justify-between gap-3 bg-card px-4 py-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium text-foreground">
                  {reminder.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {reminder.truckId} ·{" "}
                  {TYPE_LABELS[reminder.reminderType] ?? reminder.reminderType} ·{" "}
                  {formatDateIndonesian(reminder.dueDate, true)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge
                  variant="outline"
                  className={`gap-1 text-[11px] font-medium ${config.className}`}
                >
                  {config.icon}
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {daysText}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 4: Verify**
```bash
pnpm exec tsc --noEmit
```
Expected: 0 TypeScript errors

---

## Task 6: Integrasi ke Halaman Dashboard

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`

**Acceptance Criteria:**
1. Widget ditampilkan di bagian akhir halaman, **setelah** widget Top Rute (Plan #10) dan **sebelum** grid Akses Cepat Modul.
2. `getActiveReminders()` dijalankan paralel dalam `Promise.all` yang sudah ada.
3. Dibungkus dalam `Card` dengan judul "Jadwal Servis & Pajak Armada" dan badge jumlah item.
4. Widget **hanya ditampilkan untuk admin** — tidak ada perubahan tampilan investor.
5. Halaman tetap React Server Component.

**Step 3: Write implementation (GREEN)**

Modifikasi `app/(dashboard)/dashboard/page.tsx`:

```typescript
// Tambah import:
import { getActiveReminders } from "@/features/maintenance/maintenance.queries"
import { MaintenanceRemindersWidget } from "@/features/maintenance/maintenance-reminders-widget"

// Update Promise.all:
const [kpis, truckBreakdown, chartData, recentTrips, topRoutes, reminders] =
  await Promise.all([
    getDashboardKPIs(month, year),
    getTruckBreakdown(month, year),
    getDailyTripChart(month, year),
    getRecentTrips(10),
    getTopRoutes(month, year, 10),
    getActiveReminders(),             // Tambah ini
  ])

// Tambah section setelah Top Rute, sebelum grid Akses Cepat:
{/* Maintenance Reminders Widget */}
<div className="px-4 lg:px-6">
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            Jadwal Servis & Pajak Armada
          </CardTitle>
          <CardDescription className="text-xs">
            Pengingat ganti oli, uji KIR, dan pajak STNK unit W 8187 UA & H 8133 OF
          </CardDescription>
        </div>
        {reminders.length > 0 && (
          <Badge variant="outline" className="text-xs font-normal">
            {reminders.length} Jadwal
          </Badge>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <MaintenanceRemindersWidget reminders={reminders} />
    </CardContent>
  </Card>
</div>
```

**Step 4: Verify final**
```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm build && pnpm test
```
Expected: Semua PASS — 0 error TS, 0 lint warning, build sukses, seluruh unit test hijau.

---

## Seed Data Default (Opsional — Dijalankan Manual)

Setelah migrasi selesai, Admin dapat langsung menambahkan pengingat melalui UI. Atau bisa juga jalankan seed awal via script:

```typescript
// Script: pnpm tsx db/seed-maintenance.ts
// Reminder default untuk kedua truk
const defaultReminders = [
  { truckId: "W8187UA", reminderType: "oil_change", label: "Ganti Oli Mesin W8187UA", dueDate: "2026-10-01", intervalDays: 90 },
  { truckId: "H8133OF", reminderType: "oil_change", label: "Ganti Oli Mesin H8133OF", dueDate: "2026-10-15", intervalDays: 90 },
  { truckId: "W8187UA", reminderType: "kir", label: "Uji KIR W8187UA", dueDate: "2026-12-01", intervalDays: 365 },
  { truckId: "H8133OF", reminderType: "kir", label: "Uji KIR H8133OF", dueDate: "2026-11-01", intervalDays: 365 },
  { truckId: "W8187UA", reminderType: "stnk", label: "Pajak STNK W8187UA", dueDate: "2027-03-01", intervalDays: 365 },
  { truckId: "H8133OF", reminderType: "stnk", label: "Pajak STNK H8133OF", dueDate: "2027-01-01", intervalDays: 365 },
]
```

---

## Verification Plan Final

| Langkah | Perintah / Cara | Ekspektasi |
|---|---|---|
| Migrasi DB | `pnpm dlx drizzle-kit generate && pnpm dlx drizzle-kit migrate` | Tabel `maintenance_reminders` terbuat sukses |
| Unit Tests | `pnpm test` | Semua test hijau (≥ 10 test baru dari Task 2 & 3) |
| TypeScript | `pnpm exec tsc --noEmit` | 0 error |
| Linter | `pnpm lint` | 0 error, 0 warning |
| Build | `pnpm build` | Build sukses |
| Manual (browser) | Login admin → buka `/dashboard` | Widget "Jadwal Servis & Pajak" muncul dengan badge status warna merah/kuning/hijau sesuai urgensi |

---

*Setelah plan disetujui, jalankan `/scaffold-execute` untuk eksekusi Task per Task.*
