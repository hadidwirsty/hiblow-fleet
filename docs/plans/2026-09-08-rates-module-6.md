# Modul Manajemen Referensi Tarif (`/rates`) — Implementation Plan (Sequence 6)

**Tanggal:** 2026-09-08  
**Target:** Membangun antarmuka dan modul manajemen master data referensi tarif (`/rates`) untuk operasional 289 rute pabrik semen curah HW Trans, lengkap dengan fitur pencarian, filter klien pabrik, penyesuaian tarif, serta pembuatan rute baru.  
**Stack:** Next.js 16 App Router, React 19, Drizzle ORM, PostgreSQL 17, Zod, TanStack Table / shadcn/ui.

---

## Latar Belakang & State Saat Ini

1. **Skema & Data Sudah Tersedia:**
   - Skema [`db/schema/rate-references.ts`](file:///Users/hadidwirsty/Project/hiblow-fleet/db/schema/rate-references.ts) telah didefinisikan dengan kolom:
     - `id` (uuid)
     - `clientName` (varchar 50, e.g. 'SI', 'SBI', 'Indocement Grobogan')
     - `city` (varchar 100)
     - `destination` (varchar 255)
     - `ratePerTon` (numeric 12,2)
     - `standardTonnage` (numeric 6,2, default 31.00)
     - `sanguPercentage` (numeric 5,4, e.g. 0.5200)
     - `additionalTonnageRate` (numeric 12,2, default 25000.00)
     - `hasSpecialDeductions` (boolean, default false)
     - `isActive` (boolean, default true)
   - Tabel telah berisi **289 data rute acuan historis** yang diimpor dari Excel (`rates.json`).

2. **Navigasi & RBAC Sudah Terdaftar:**
   - Rute `/rates` sudah ada di menu [`components/app-sidebar.tsx`](file:///Users/hadidwirsty/Project/hiblow-fleet/components/app-sidebar.tsx) (baik di `navMain` maupun `navSecondary`).
   - Rute `/rates` sudah dilindungi di [`proxy.ts`](file:///Users/hadidwirsty/Project/hiblow-fleet/proxy.ts) dan [`lib/rbac.ts`](file:///Users/hadidwirsty/Project/hiblow-fleet/lib/rbac.ts) sebagai rute admin-only (`ADMIN_ONLY_ROUTES`).

3. **Masalah Saat Ini:**
   - Folder `app/(dashboard)/rates` belum ada sama sekali sehingga mengklik menu "Referensi Tarif" menghasilkan halaman 404.
   - Pengelola (Mas Hafidz) belum memiliki antarmuka untuk memeriksa tarif per kota, mengubah tarif jika ada penyesuaian harga semen/solar, atau mendaftarkan rute pabrik baru.

---

## Gap Analysis (Source of Truth Mapping)

| Kata Benda / Entitas Data | Sumber / Tabel | Task Pemetaan |
|---|---|---|
| `clientName` (Pabrik Klien) | `rate_references.client_name` | Task 1 (Zod), Task 2 (Query Filter), Task 4 (Dropdown) |
| `city` (Kota Tujuan) | `rate_references.city` | Task 1 (Zod), Task 2 (Search Query), Task 4 (Table & Form) |
| `destination` (Pabrik / Batching Plant) | `rate_references.destination` | Task 1 (Zod), Task 2 (Search Query), Task 4 (Table & Form) |
| `ratePerTon` (Tarif per Ton) | `rate_references.rate_per_ton` | Task 1 (Zod), Task 2 (Queries), Task 4 (Table & Currency Input) |
| `standardTonnage` (Tonase Standar) | `rate_references.standard_tonnage` | Task 1 (Zod), Task 4 (Default 31 ton) |
| `sanguPercentage` (% Sangu Supir) | `rate_references.sangu_percentage` | Task 1 (Zod), Task 4 (Percent Input + Nominal Acuan) |
| `additionalTonnageRate` (Tarif Kelebihan Tonase) | `rate_references.additional_tonnage_rate` | Task 1 (Zod), Task 4 (Default Rp 25.000) |
| `hasSpecialDeductions` (Potongan Grobogan/LJU) | `rate_references.has_special_deductions` | Task 1 (Zod), Task 4 (Badge & Switch Toggle) |
| `isActive` (Status Aktif) | `rate_references.is_active` | Task 1 (Zod), Task 3 (Toggle Action), Task 4 (Badge) |

| Kata Kerja / Tindakan | Deskripsi Aksi | Task Pemetaan |
|---|---|---|
| Cari Rute & Filter Klien | Memfilter 289 rute berdasarkan kata kunci kota/tujuan/pabrik | Task 2 (Queries), Task 4 (Search UI) |
| Tambah Tarif Rute Baru | Modal form simpan rute dan tarif baru ke database | Task 1 (Schema), Task 3 (Action), Task 4 (Dialog) |
| Edit Tarif & Persentase Sangu | Mengubah tarif per ton atau % sangu supir pada rute tertentu | Task 1 (Schema), Task 3 (Action), Task 4 (Dialog) |
| Aktifkan / Nonaktifkan Rute | Toggle rute yang sudah tidak aktif tanpa menghapus riwayat trip | Task 3 (Toggle Action), Task 4 (Switch Button) |
| Tinjau Ringkasan Tarif | Kartu KPI total rute, jumlah klien, dan rerata tarif | Task 2 (Queries), Task 4 (Summary Component) |

---

## Proposed Changes

```text
features/rates/
├── rates.schema.ts               [NEW - SELESAI] Zod validation & typing
├── rates.queries.ts              [NEW - SELESAI] Drizzle select queries & aggregation
├── rates.actions.ts              [NEW - SELESAI] Server Actions (create, update, toggle, delete)
├── rates-summary.tsx             [NEW - SELESAI] KPI cards (Total Rute, Klien, Rerata Tarif)
├── rates-table.tsx               [NEW - SELESAI] Data table dengan pagination & action dropdown
└── rate-form-dialog.tsx          [NEW - SELESAI] Form dialog tambah & edit tarif

app/(dashboard)/rates/
└── page.tsx                      [NEW - SELESAI] RSC page entry point

domain/__tests__/
├── rates-schema.test.ts          [NEW - SELESAI] Unit test schema validation
├── rates-queries.test.ts         [NEW - SELESAI] Unit test query builder & filter
└── rates-actions.test.ts         [NEW - SELESAI] Unit test server actions & validation guard
```

---

## Definisi Tugas Atomik

### Task 1: Schema & Validasi Zod (`features/rates/rates.schema.ts`)

**Files:**
- Create: `features/rates/rates.schema.ts`
- Test: `domain/__tests__/rates-schema.test.ts`

**Requirements:**
- **Acceptance Criteria**
  1. `createRateReferenceSchema` memvalidasi input pembuatan tarif baru dengan nilai wajib: `clientName`, `city`, `destination`, `ratePerTon`, `sanguPercentage`.
  2. `standardTonnage` memiliki default `31.00`, `additionalTonnageRate` memiliki default `25000.00`.
  3. `sanguPercentage` menerima format angka desimal (e.g., `0.52` untuk 52%) atau string numerik yang dapat diparse, dengan rentang nilai valid antara `0.01` (1%) hingga `0.99` (99%).
  4. `ratePerTon` harus bernilai positif (> 0).
  5. `updateRateReferenceSchema` mewajibkan `id` bertipe UUID dan mendukung partial update fields.

- **Functional Requirements**
  1. Ekspor tipe `CreateRateReferenceInput` dan `UpdateRateReferenceInput`.
  2. Validasi error message informatif dalam Bahasa Indonesia.

- **Non-Functional Requirements**
  - Mengikuti standar `.agents/skills/clean-code-standards/SKILL.md`.

- **Test Coverage**
  - [Unit] `createRateReferenceSchema.safeParse()`: lolos untuk data valid.
  - [Unit] `createRateReferenceSchema.safeParse()`: gagal untuk tarif <= 0.
  - [Unit] `createRateReferenceSchema.safeParse()`: gagal untuk persentase sangu di luar 0-1.
  - [Unit] `updateRateReferenceSchema.safeParse()`: gagal jika UUID id tidak valid.

**Step 1: Write failing test (RED)**
```typescript
// domain/__tests__/rates-schema.test.ts
import { describe, expect, it } from "vitest"
import { createRateReferenceSchema, updateRateReferenceSchema } from "@/features/rates/rates.schema"

describe("Rates Schema Validation", () => {
  it("harus memvalidasi data pembuatan tarif yang sah", () => {
    const validData = {
      clientName: "SI",
      city: "REMBANG",
      destination: "SAFINA PL RBG",
      ratePerTon: "62795.50",
      sanguPercentage: "0.5200",
      hasSpecialDeductions: false,
    }
    const result = createRateReferenceSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("harus menolak tarif per ton bernilai nol atau negatif", () => {
    const invalidData = {
      clientName: "SI",
      city: "REMBANG",
      destination: "SAFINA PL RBG",
      ratePerTon: "-1000",
      sanguPercentage: "0.52",
    }
    const result = createRateReferenceSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it("harus menolak persentase sangu di atas 100%", () => {
    const invalidData = {
      clientName: "SI",
      city: "REMBANG",
      destination: "SAFINA PL RBG",
      ratePerTon: "50000",
      sanguPercentage: "1.5",
    }
    const result = createRateReferenceSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it("harus mewajibkan UUID valid pada update schema", () => {
    const invalidUpdate = {
      id: "bukan-uuid",
      ratePerTon: "70000",
    }
    const result = updateRateReferenceSchema.safeParse(invalidUpdate)
    expect(result.success).toBe(false)
  })
})
```

**Step 2: Verify test fails**
```bash
pnpm test domain/__tests__/rates-schema.test.ts
```
Expected: FAIL (`Cannot find module '@/features/rates/rates.schema'`).

**Step 3: Write minimal implementation (GREEN)**
Buat `features/rates/rates.schema.ts` dengan Zod schema lengkap.

**Step 4: Verify test passes & Refactor**
```bash
pnpm test domain/__tests__/rates-schema.test.ts
pnpm exec tsc --noEmit && pnpm lint
```
Expected: PASS.

---

### Task 2: Queries & KPI Summary (`features/rates/rates.queries.ts`)

**Files:**
- Create: `features/rates/rates.queries.ts`
- Test: `domain/__tests__/rates-queries.test.ts`

**Requirements:**
- **Acceptance Criteria**
  1. `listRateReferences(filter)` mengembalikan array `RateReference[]` dari database.
  2. Filter mendukung pencarian teks `search` yang mencocokkan `city`, `destination`, atau `clientName` secara case-insensitive (`ilike`).
  3. Filter mendukung pemilihan `clientName` spesifik (e.g. 'SI', 'SBI', 'Indocement Grobogan').
  4. Filter mendukung status `isActive` (semua / aktif saja / non-aktif saja).
  5. `getRateReferencesSummary()` mengembalikan `{ totalRoutes, activeRoutes, uniqueClients, avgRatePerTon, specialDeductionRoutes }`.
  6. `getDistinctClients()` mengembalikan daftar string nama klien unik yang terurut secara alfabetis.

- **Functional Requirements**
  1. Menggunakan Drizzle ORM queries dengan operator `and`, `or`, `ilike`, `eq`, `sql`.
  2. Type-safe interface `ListRateReferencesFilter` dan `RateReferencesSummary`.

- **Test Coverage**
  - [Unit] `listRateReferences()`: mengembalikan array dan merespon filter.
  - [Unit] `getRateReferencesSummary()`: menghitung agregasi numerik dengan benar.

**Step 1: Write failing test (RED)**
```typescript
// domain/__tests__/rates-queries.test.ts
import { describe, expect, it } from "vitest"
import { listRateReferences, getRateReferencesSummary, getDistinctClients } from "@/features/rates/rates.queries"

describe("Rates Queries", () => {
  it("harus mengembalikan array daftar tarif", async () => {
    const rates = await listRateReferences({ limit: 10 })
    expect(Array.isArray(rates)).toBe(true)
  })

  it("harus mengembalikan summary agregasi tarif", async () => {
    const summary = await getRateReferencesSummary()
    expect(typeof summary.totalRoutes).toBe("number")
    expect(typeof summary.activeRoutes).toBe("number")
    expect(typeof summary.avgRatePerTon).toBe("number")
  })

  it("harus mengembalikan daftar klien pabrik unik", async () => {
    const clients = await getDistinctClients()
    expect(Array.isArray(clients)).toBe(true)
  })
})
```

**Step 2: Verify test fails**
```bash
pnpm test domain/__tests__/rates-queries.test.ts
```
Expected: FAIL (`Cannot find module '@/features/rates/rates.queries'`).

**Step 3: Write minimal implementation (GREEN)**
Buat `features/rates/rates.queries.ts`.

**Step 4: Verify test passes & Refactor**
```bash
pnpm test domain/__tests__/rates-queries.test.ts
pnpm exec tsc --noEmit && pnpm lint
```
Expected: PASS.

---

### Task 3: Server Actions (`features/rates/rates.actions.ts`)

**Files:**
- Create: `features/rates/rates.actions.ts`
- Test: `domain/__tests__/rates-actions.test.ts`

**Requirements:**
- **Acceptance Criteria**
  1. `createRateReference(input)`: memvalidasi input dengan Zod, memeriksa autentikasi Admin via `getCurrentSession()` & `assertAdmin()`, menyimpan ke tabel `rate_references`, memanggil `revalidatePath("/rates")`, dan mengembalikan `{ success: true, rate }`.
  2. `updateRateReference(input)`: memvalidasi `id` dan perubahan field, memutakhirkan data tarif di PostgreSQL, dan memanggil `revalidatePath("/rates")`.
  3. `toggleRateReferenceStatus(id, isActive)`: membalik status aktif/non-aktif tarif rute.
  4. `deleteRateReference(id)`: menghapus rute referensi (dengan penanganan aman jika ada foreign key constraint pada tabel `trips`).
  5. Menolak mutasi jika user tidak login atau bukan admin dengan pesan error yang ramah.

- **Functional Requirements**
  1. Berkas ditandai dengan direktif `"use server"`.
  2. Response standardized: `{ success: true, ... }` atau `{ success: false, error: string }`.

- **Test Coverage**
  - [Unit] `createRateReference`: mengembalikan validation error untuk input kosong/invalid.
  - [Unit] `updateRateReference`: mengembalikan validation error jika id bukan UUID.

**Step 1: Write failing test (RED)**
```typescript
// domain/__tests__/rates-actions.test.ts
import { describe, expect, it } from "vitest"
import { createRateReference, updateRateReference } from "@/features/rates/rates.actions"

describe("Rates Server Actions Validation Guard", () => {
  it("harus menolak createRateReference jika input tidak valid", async () => {
    // @ts-expect-error deliberately invalid payload
    const res = await createRateReference({})
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toBeDefined()
    }
  })

  it("harus menolak updateRateReference jika id bukan UUID", async () => {
    const res = await updateRateReference({ id: "invalid-id", ratePerTon: "50000" })
    expect(res.success).toBe(false)
  })
})
```

**Step 2: Verify test fails**
```bash
pnpm test domain/__tests__/rates-actions.test.ts
```
Expected: FAIL (`Cannot find module '@/features/rates/rates.actions'`).

**Step 3: Write minimal implementation (GREEN)**
Buat `features/rates/rates.actions.ts`.

**Step 4: Verify test passes & Refactor**
```bash
pnpm test domain/__tests__/rates-actions.test.ts
pnpm exec tsc --noEmit && pnpm lint
```
Expected: PASS.

---

### Task 4: Komponen UI — Tabel, Filter, Summary, & Dialog Form

**Files:**
- Create: `features/rates/rates-summary.tsx`
- Create: `features/rates/rate-form-dialog.tsx`
- Create: `features/rates/rates-table.tsx`

**Requirements:**
- **Acceptance Criteria**
  1. `rates-summary.tsx`: menampilkan 4 KPI cards:
     - **Total Rute Terdaftar** (angka total)
     - **Rute Aktif Beroperasi** (angka rute aktif + badge)
     - **Rata-rata Tarif / Ton** (format rupiah IDR)
     - **Rute Potongan Khusus** (jumlah rute LJU/Grobogan)
  2. `rate-form-dialog.tsx`:
     - Modal dialog responsif untuk "Tambah Rute Baru" dan "Edit Rute".
     - Field: Klien Pabrik (input/suggest 'SI', 'SBI', 'Indocement Grobogan'), Kota, Nama Pabrik/Tujuan, Tarif per Ton (Rp), Tonase Standar (default 31.00), Persentase Sangu (default 52%), Tarif Tonase Tambahan (default Rp 25.000), dan Switch Potongan Khusus Grobogan/LJU.
     - Pratinjau otomatis nominal sangu supir acuan: $\text{Tarif} \times 31 \times \%\text{Sangu}$.
     - Tombol submit dengan loading state.
  3. `rates-table.tsx`:
     - Menampilkan daftar tarif dengan kolom: Pabrik Klien, Kota, Tujuan Pabrik, Tarif / Ton, % Sangu Supir, Estimasi Sangu Supir (31t), Potongan Khusus, Status, dan Menu Aksi (...).
     - Kolom Pencarian real-time (input search debounced).
     - Filter dropdown berdasarkan Pabrik Klien dan Status (Semua / Aktif / Non-Aktif).
     - Pagination interaktif (10 / 25 / 50 baris per halaman).
     - Aksi dropdown: Edit Tarif, Toggle Aktif/Non-aktif.
     - Empty state ramah jika hasil pencarian tidak ditemukan.

- **Non-Functional Requirements**
  - Menggunakan komponen shadcn/ui dan ikon Remix Icon (`@remixicon/react`).
  - Mobile-first responsif, overflow scroll horizontal yang rapi pada layar kecil.

**Step 3: Write implementation (GREEN)**
Implementasikan `rates-summary.tsx`, `rate-form-dialog.tsx`, dan `rates-table.tsx`.

**Step 4: Verify typecheck & lint**
```bash
pnpm exec tsc --noEmit && pnpm lint
```
Expected: PASS.

---

### Task 5: Route Page (`app/(dashboard)/rates/page.tsx`) & Integrasi Navigasi

**Files:**
- Create: `app/(dashboard)/rates/page.tsx`

**Requirements:**
- **Acceptance Criteria**
  1. Halaman `/rates` dapat diakses langsung oleh Admin via sidebar dan URL.
  2. Server Component memuat data riil via `listRateReferences`, `getRateReferencesSummary`, dan `getDistinctClients`.
  3. Menampilkan Header Halaman:
     - Judul: "Referensi Tarif Pabrik"
     - Subjudul: "Master data acuan tarif per ton dan nominal sangu supir untuk 289 rute pabrik semen curah HW Trans"
     - Tombol CTA: `+ Tambah Rute Baru` yang membuka `RateFormDialog`.
  4. Komponen `RatesSummary` dan `RatesTable` dirender secara mulus.
  5. Jika diakses oleh akun Partner/Investor, `proxy.ts` dan RBAC layout secara otomatis mengarahkan ke `/profit-sharing`.

- **Step 3: Write implementation (GREEN)**
Buat `app/(dashboard)/rates/page.tsx`.

- **Step 4: Forensic Verification**
```bash
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```
Expected: Seluruh automated test lulus (87+ tests), typecheck 0 error, build Next.js 16 berhasil dengan rute `ƒ /rates` terdaftar resmi.

---

## Urutan Eksekusi

```text
Task 1 (Schema & Validasi)
   │
   ▼
Task 2 (Queries & KPI Aggregates)
   │
   ▼
Task 3 (Server Actions CRUD)
   │
   ▼
Task 4 (Komponen UI: Summary, Dialog, Table)
   │
   ▼
Task 5 (Page Route & Verifikasi Build)
```

---

## Verification Plan

### Automated Tests
```bash
pnpm test domain/__tests__/rates-schema.test.ts
pnpm test domain/__tests__/rates-queries.test.ts
pnpm test domain/__tests__/rates-actions.test.ts
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

### Manual Verification (oleh User)
- [ ] Buka `http://localhost:3000/rates` setelah login sebagai Admin ➔ Halaman tampil dengan 289 rute dari database.
- [ ] Lakukan pencarian nama kota (misal: "KUDUS" atau "REMBANG") ➔ Tabel memfilter data secara responsif.
- [ ] Filter berdasarkan klien (misal: "SI" atau "SBI") ➔ Hanya rute klien terpilih yang ditampilkan.
- [ ] Klik "+ Tambah Rute Baru" ➔ Masukkan rute uji coba baru ➔ Rute tersimpan dan muncul di tabel.
- [ ] Edit tarif rute uji coba ➔ Nilai tarif terupdate seketika.
- [ ] Login sebagai Partner (`alfiah@hiblow.fleet`) lalu coba buka `/rates` ➔ Otomatis diarahkan ke `/profit-sharing`.
