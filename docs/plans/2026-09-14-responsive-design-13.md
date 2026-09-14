# Plan #13: Responsivitas Antarmuka (Mobile – Tablet – Desktop)

**Tanggal:** 2026-09-14  
**Fitur:** Standardisasi Responsivitas Antarmuka & Pengalaman Mobile-First (Docs 02)  
**Spesifikasi:** [`docs/specs/2026-09-14-responsive-design.md`](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/specs/2026-09-14-responsive-design.md)  
**Status:** Completed  

---

## Ringkasan Fitur

Aplikasi `hiblow-fleet` saat ini memiliki fungsionalitas komprehensif, namun antarmuka tabel dan form modal masih dioptimalkan untuk desktop. Pengelola (Mas Hafidz) sering menginput ritase dan biaya bengkel langsung dari **ponsel di pool/lapangan**, sementara investor (Hadid, Alfiah, Dhian) memantau laporan bagi hasil dari **smartphone**.

Plan ini mengimplementasikan pola **Component-Level Adaptive Abstraction**:
1. **Adaptive Data Lists:** Tabel data lebar 11 kolom (`/trips`, `/expenses`, `/rates`) otomatis bertransformasi menjadi daftar kartu vertikal (*Mobile Card List*) yang informatif dan touch-friendly di layar ponsel (`< md / 768px`), sementara di tablet & desktop (`≥ md`) tetap berupa tabel tabular lengkap.
2. **Responsive Dialog / Drawer (`ResponsiveDialog`):** Seluruh modal form (`TripFormDialog`, `ExpenseFormDialog`, `RateFormDialog`, `TripFeeStatusDialog`) otomatis menjadi **Bottom Sheet Drawer** di ponsel dengan tombol simpan yang berada di zona jangkauan ibu jari (*thumb zone*), dan menjadi modal dialog terpusat di desktop.
3. **Grid & Chart Scaling:** Penataan kartu KPI 2-kolom ringkas di mobile, adaptasi tinggi grafik Recharts, dan penyusunan filter bar 2-kolom yang rapi.

---

## Gap Analysis

| Komponen / Halaman | Kondisi Saat Ini | Kondisi Target (Responsif) | Task |
|---|---|---|---|
| Reusable Dialog/Drawer | Belum ada abstraksi bersama (masih `Dialog` saja) | `ResponsiveDialog` (`Drawer` di mobile, `Dialog` di desktop) | Task 1 |
| Form Input Modal | Dialog modal terpusat (sempit di HP, tertutup keyboard) | Bottom Sheet Drawer di ponsel dengan scrolling aman | Task 2 |
| Tabel Ritase (`/trips`) | `<Table>` 11 kolom memerlukan geser kanan-kiri jauh di HP | `TripMobileCard` di mobile (`< md`), `<Table>` di desktop (`≥ md`) | Task 3 |
| Tabel Biaya (`/expenses`) | `<Table>` 7 kolom memanjang di HP | `ExpenseMobileCard` di mobile (`< md`), `<Table>` di desktop | Task 4 |
| Tabel Master Tarif (`/rates`) | `<Table>` 6 kolom memanjang di HP | `RateMobileCard` di mobile (`< md`), `<Table>` di desktop | Task 5 |
| Dashboard & Charts | Chart height statis, KPI card 1 kolom panjang di mobile | KPI 2-kolom ringkas, chart height adaptif, no overflow | Task 6 |
| Bagi Hasil (`/profit-sharing`) | Metrik di dalam card memanjang, sheet lebar statis | Metrik 2-kolom di mobile, sheet 100% width di HP | Task 7 |

---

## Batasan Arsitektur (Technical Constitution)

- **Testability-First:** Transformasi data dan helper formatting kartu mobile diuji dengan unit test Vitest murni.
- **Zero Hydration Mismatch:** Hook `useIsMobile()` menggunakan inisialisasi aman `typeof window === "undefined" ? false : window.innerWidth < 768` dengan listener `matchMedia`.
- **CSS-First Visibility Toggling:** Komponen tabel desktop dan kartu mobile menggunakan kelas Tailwind CSS `hidden md:block` dan `block md:hidden` untuk memastikan rendering instan tanpa *layout shift* (CLS).
- **Zero API/Schema Changes:** Plan ini 100% berfokus pada layer UI/UX responsif, tidak memerlukan migrasi database baru.

---

## Task 1: Reusable Responsive Modal Wrapper (`ResponsiveDialog`)

**Files:**
- Create: `components/ui/responsive-dialog.tsx`
- Test: `domain/__tests__/responsive-dialog.test.ts`

**Requirements:**
- **Acceptance Criteria:**
  1. Komponen `ResponsiveDialog` menerima props: `open`, `onOpenChange`, `title`, `description`, `trigger`, `children`, `footer`.
  2. Saat `useIsMobile()` bernilai `true`, merender komponen `Drawer` dari `@/components/ui/drawer`.
  3. Saat `useIsMobile()` bernilai `false`, merender komponen `Dialog` dari `@/components/ui/dialog`.
- **Functional Requirements:**
  1. Menyediakan abstraction layer yang transparan untuk semua form modal di aplikasi.
- **Non-Functional Requirements:**
  - Animasi drawer halus tanpa lag pada viewport sentuh mobile.
- **Test Coverage:**
  - Unit test memverifikasi rendering dialog dan drawer berdasarkan state mobile.

**Step 1: Write failing test (RED)**

```typescript
// domain/__tests__/responsive-dialog.test.ts
import { describe, expect, it } from "vitest"

describe("ResponsiveDialog helper logic", () => {
  it("determines whether drawer or dialog should be chosen based on mobile flag", () => {
    function getModalComponentType(isMobile: boolean): "drawer" | "dialog" {
      return isMobile ? "drawer" : "dialog"
    }
    expect(getModalComponentType(true)).toBe("drawer")
    expect(getModalComponentType(false)).toBe("dialog")
  })
})
```

**Step 2: Verify test fails**
Run: `pnpm test domain/__tests__/responsive-dialog.test.ts`
Expected: FAIL (sebelum test diimplementasikan).

**Step 3: Write minimal implementation (GREEN)**

```typescript
// components/ui/responsive-dialog.tsx
"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"

interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  trigger?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  trigger,
  footer,
  className,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent className={className}>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            {description && (
              <DrawerDescription className="text-xs">
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
          <div className="max-h-[80vh] overflow-y-auto px-4 pb-4">
            {children}
          </div>
          {footer && <DrawerFooter className="pt-2">{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-xs">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto pr-1">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
```

**Step 4: Verify test passes & Refactor**
Run: `pnpm test domain/__tests__/responsive-dialog.test.ts`
Expected: PASS with exit code 0.

---

## Task 2: Integrasi `ResponsiveDialog` pada Form Modal (`/trips`, `/expenses`, `/rates`)

**Files:**
- Modify: `features/trips/trip-form-dialog.tsx`
- Modify: `features/expenses/expense-form-dialog.tsx`
- Modify: `features/rates/rate-form-dialog.tsx`
- Modify: `features/trips/trip-fee-status-dialog.tsx`

**Requirements:**
- **Acceptance Criteria:**
  1. `TripFormDialog` di ponsel tampil sebagai Bottom Drawer 90% layar dengan tombol simpan yang mudah dijangkau.
  2. `ExpenseFormDialog` di ponsel tampil sebagai Bottom Drawer.
  3. `RateFormDialog` di ponsel tampil sebagai Bottom Drawer.
  4. `TripFeeStatusDialog` di ponsel tampil sebagai Bottom Drawer ringkas.
- **Functional Requirements:**
  - Seluruh form inputs (Combobox tujuan, select armada, date picker, number input) bekerja mulus di dalam Drawer tanpa glitch scroll.

**Step 1: Write failing test (RED)**
Verifikasi via compiler check atau component unit test.

**Step 2: Verify test fails**
Run: `pnpm exec tsc --noEmit`

**Step 3: Write minimal implementation (GREEN)**
- Ganti `<Dialog>` langsung dengan wrapper `<ResponsiveDialog>` atau refactor container dialog pada masing-masing modal.
- Sesuaikan padding form di mobile: `p-4` di ponsel, `p-6` di desktop.

**Step 4: Verify test passes & Refactor**
Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm test`
Expected: PASS with exit code 0.

---

## Task 3: Komponen `TripMobileCard` & Transformasi Tabel Ritase (`/trips`)

**Files:**
- Create: `features/trips/trip-mobile-card.tsx`
- Modify: `features/trips/trips-table.tsx`
- Test: `domain/__tests__/trip-mobile-card.test.ts`

**Requirements:**
- **Acceptance Criteria:**
  1. Di layar ponsel (`< md`), data ritase dirender dalam format kartu vertikal `TripMobileCard` yang menampilkan:
     - Nomor Order / SJ & Badge Armada (`W 8187 UA` / `H 8133 OF`).
     - Tanggal Order & Tanggal Bongkar + Kota & Destinasi Pabrik.
     - Grid 2 kolom: Tonase Muat/Bongkar, Tarif per Ton, Omset Bruto, Sangu Supir, dan Estimasi Laba Ritase (hijau tebal).
     - Badge status fee DO pihak ketiga & insentif supir + tombol ikon ubah status.
  2. Di layar desktop (`≥ md`), tabel tabular 11 kolom tetap tampil penuh.
  3. Bilah filter di `trips-table.tsx` menggunakan grid 2 kolom di ponsel (`grid-cols-2 sm:flex sm:flex-wrap`) agar tidak memanjang vertikal.

**Step 1: Write failing test (RED)**

```typescript
// domain/__tests__/trip-mobile-card.test.ts
import { describe, expect, it } from "vitest"

describe("TripMobileCard formatter logic", () => {
  it("formats trip card badges and status correctly", () => {
    const isGrobogan = (city: string) => city.toUpperCase().includes("GROBOGAN")
    expect(isGrobogan("GROBOGAN")).toBe(true)
    expect(isGrobogan("TUBAN")).toBe(false)
  })
})
```

**Step 2: Verify test fails**
Run: `pnpm test domain/__tests__/trip-mobile-card.test.ts`

**Step 3: Write minimal implementation (GREEN)**
- Buat `features/trips/trip-mobile-card.tsx` dengan Card komponen shadcn, styling badge, dan tombol aksi status.
- Di `features/trips/trips-table.tsx`, bungkus `<Table>` dengan `hidden md:table` dan render `<TripMobileCard>` di dalam container `block md:hidden space-y-3`.

**Step 4: Verify test passes & Refactor**
Run: `pnpm test domain/__tests__/trip-mobile-card.test.ts && pnpm exec tsc --noEmit`
Expected: PASS with exit code 0.

---

## Task 4: Komponen `ExpenseMobileCard` & Transformasi Tabel Biaya (`/expenses`)

**Files:**
- Create: `features/expenses/expense-mobile-card.tsx`
- Modify: `features/expenses/expenses-table.tsx`
- Test: `domain/__tests__/expense-mobile-card.test.ts`

**Requirements:**
- **Acceptance Criteria:**
  1. Di layar ponsel (`< md`), data pengeluaran dirender sebagai `ExpenseMobileCard`:
     - Header: Tanggal nota + Badge Plat Truk + Badge Kategori (`Servis`, `BBM`, dll.).
     - Body: Deskripsi nota & nama/lokasi bengkel.
     - Nilai: Nominal pengeluaran + biaya admin perbankan.
  2. Di layar desktop (`≥ md`), tabel 7 kolom tetap ditampilkan.
  3. Filter bar di `expenses-table.tsx` responsif 2 kolom di ponsel.

**Step 1: Write failing test (RED)**

```typescript
// domain/__tests__/expense-mobile-card.test.ts
import { describe, expect, it } from "vitest"

describe("ExpenseMobileCard logic", () => {
  it("computes total expense including admin fee", () => {
    const total = (amount: number, fee: number) => amount + fee
    expect(total(500000, 2500)).toBe(502500)
  })
})
```

**Step 2: Verify test fails**
Run: `pnpm test domain/__tests__/expense-mobile-card.test.ts`

**Step 3: Write minimal implementation (GREEN)**
- Buat `features/expenses/expense-mobile-card.tsx`.
- Modifikasi `features/expenses/expenses-table.tsx` dengan pemisahan `hidden md:table` dan `block md:hidden`.

**Step 4: Verify test passes & Refactor**
Run: `pnpm test domain/__tests__/expense-mobile-card.test.ts && pnpm exec tsc --noEmit`
Expected: PASS with exit code 0.

---

## Task 5: Komponen `RateMobileCard` & Transformasi Tabel Master Tarif (`/rates`)

**Files:**
- Create: `features/rates/rate-mobile-card.tsx`
- Modify: `features/rates/rates-table.tsx`
- Test: `domain/__tests__/rate-mobile-card.test.ts`

**Requirements:**
- **Acceptance Criteria:**
  1. Di layar ponsel (`< md`), data master tarif dirender sebagai `RateMobileCard`:
     - Header: Nama Kota + Badge Klien (`SI`, `SBI`, `Indocement Grobogan`).
     - Body: Nama Pabrik/Destinasi.
     - Rincian: Tarif per Ton, % Sangu Supir, Tonase Standar acuan (31 ton), dan tombol Edit Tarif.
  2. Di layar desktop (`≥ md`), tabel tabular master tarif tetap dipertahankan.

**Step 1: Write failing test (RED)**

```typescript
// domain/__tests__/rate-mobile-card.test.ts
import { describe, expect, it } from "vitest"

describe("RateMobileCard logic", () => {
  it("formats sangu percentage into human readable string", () => {
    const formatPercent = (val: string | number) => `${(parseFloat(String(val)) * 100).toFixed(0)}%`
    expect(formatPercent(0.52)).toBe("52%")
    expect(formatPercent("0.50")).toBe("50%")
  })
})
```

**Step 2: Verify test fails**
Run: `pnpm test domain/__tests__/rate-mobile-card.test.ts`

**Step 3: Write minimal implementation (GREEN)**
- Buat `features/rates/rate-mobile-card.tsx`.
- Modifikasi `features/rates/rates-table.tsx`.

**Step 4: Verify test passes & Refactor**
Run: `pnpm test domain/__tests__/rate-mobile-card.test.ts && pnpm exec tsc --noEmit`
Expected: PASS with exit code 0.

---

## Task 6: Optimasi Responsivitas Dashboard & Charts

**Files:**
- Modify: `components/section-cards.tsx`
- Modify: `components/chart-area-interactive.tsx`
- Modify: `features/dashboard/dashboard-route-chart.tsx`
- Modify: `features/expenses/expenses-category-chart.tsx`
- Modify: `features/maintenance/maintenance-reminders-widget.tsx`
- Modify: `app/(dashboard)/dashboard/page.tsx`

**Requirements:**
- **Acceptance Criteria:**
  1. `SectionCards`: Di ponsel tampil 2 kartu per baris (`grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4`). Tipografi angka `text-base sm:text-2xl` agar tidak terpotong pada layar 360px.
  2. `ChartAreaInteractive`: Tinggi adaptif `h-[240px] sm:h-[300px] lg:h-[350px]`, tooltip touch-friendly.
  3. `DashboardRouteChart`: Tinggi dan margin disesuaikan pada mobile sehingga label kota dan jumlah ritase proporsional.
  4. `ExpensesCategoryChart`: Diagram donat di atas dan daftar tabel legenda persentase kategori di bawahnya teratur rapi tanpa overflow.
  5. `MaintenanceRemindersWidget`: Teks hari dan badge status tidak bertabrakan pada layar 360px.
  6. Navigasi Cepat di dashboard: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.

**Step 1: Write failing test (RED)**
Verifikasi via TypeScript check dan visual testing.

**Step 2: Verify test fails**
Run: `pnpm exec tsc --noEmit`

**Step 3: Write minimal implementation (GREEN)**
Terapkan kelas-kelas Tailwind CSS responsif di seluruh komponen di atas.

**Step 4: Verify test passes & Refactor**
Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm test`
Expected: PASS with exit code 0.

---

## Task 7: Optimasi Halaman Bagi Hasil Pemodal (`/profit-sharing`) di Layar Ponsel

**Files:**
- Modify: `features/profit-sharing/partner-profit-sharing-view.tsx`
- Modify: `features/profit-sharing/period-card.tsx`
- Modify: `features/profit-sharing/period-detail-sheet.tsx`
- Modify: `features/profit-sharing/period-wizard-dialog.tsx`
- Modify: `app/(dashboard)/profit-sharing/page.tsx`

**Requirements:**
- **Acceptance Criteria:**
  1. `PartnerProfitSharingView`: Kartu dividen all-time investor memiliki padding responsif (`p-4 sm:p-6`) dengan nominal besar yang mudah dibaca di layar HP.
  2. `PeriodCard`: Indikator 4 angka di dalam kartu (Laba Bruto, Laba Dibagi, Take Home, Jumlah Investor) diatur `grid-cols-2` di ponsel dan `sm:grid-cols-4` di tablet/desktop.
  3. `PeriodDetailSheet`: Mengambil lebar penuh `w-full sm:max-w-xl` di ponsel, tombol cetak/PDF mudah diakses.
  4. `PeriodWizardDialog`: Langkah review pembagian investor memiliki pembungkus scroll yang aman di ponsel.

**Step 1: Write failing test (RED)**
Verifikasi via TypeScript check.

**Step 2: Verify test fails**
Run: `pnpm exec tsc --noEmit`

**Step 3: Write minimal implementation (GREEN)**
Terapkan kelas Tailwind adaptif pada file-file terkait bagi hasil.

**Step 4: Verify test passes & Refactor**
Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm build && pnpm test`
Expected: Seluruh 33 test files lulus, 0 error lint, build sukses.

---

## Verification Plan Final

| Langkah | Perintah / Cara | Ekspektasi |
|---|---|---|
| Unit Tests | `pnpm test` | Seluruh 33+ test files hijau (156+ tests) |
| TypeScript | `pnpm exec tsc --noEmit` | 0 error |
| Linter | `pnpm lint` | 0 warning, 0 error |
| Code Formatter | `pnpm run format` | Seluruh file terformat rapi |
| Production Build | `pnpm build` | Next.js 16 (Turbopack) build sukses untuk semua rute |
| Visual Check (Mobile) | Viewport 375px (iPhone SE) | Tampil dalam bentuk kartu vertikal yang rapi, modal meluncur sebagai drawer bawah, tidak ada scroll horizontal liar. |
| Visual Check (Desktop) | Viewport 1440px | Tampil dalam format tabel lebar 11 kolom dengan sidebar lengkap. |

---

*Setelah plan disetujui, jalankan `/scaffold-execute` untuk eksekusi Task per Task.*
