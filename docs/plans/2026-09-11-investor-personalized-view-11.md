# Plan #11: Personalisasi Tampilan Dividen Akun Investor

**Tanggal:** 2026-09-11
**Fitur:** Investor Personalized Dividend View (Docs 02 No. 2.2 — Should Have)
**Status:** Completed (Executed on 2026-09-14)

---

## Ringkasan Fitur

Saat ini, investor (`role: "partner"`) yang login melihat halaman `/profit-sharing` yang menampilkan **seluruh periode** secara generik tanpa diferensiasi kepemilikan. Fitur ini menyempurnakan tampilan investor dengan:

1. **Kartu Sorotan Personal ("Hak Dividen Anda"):** Menampilkan **akumulasi total dividen** yang menjadi hak akun investor yang sedang login — dihitung langsung dari `profit_shares` yang memiliki `partnerUserId === session.user.id`.
2. **Highlighting Baris Dividen Sendiri:** Di dalam setiap `PeriodCard`, baris investor yang bersangkutan ditandai secara visual (border/background berbeda) sehingga investor langsung tahu berapa hak mereka di periode itu.
3. **Fallback Graceful:** Jika akun investor **belum di-link** ke `partnerUserId` di `profit_shares` (masih `null`), tampilan tetap berjalan normal seperti sebelumnya — tanpa error.

**Mekanisme Linking yang Ada:**
- Kolom `profit_shares.partner_user_id` (nullable `text`) sudah ada di skema DB.
- Admin mengisi `partnerUserId` saat membuat/mengedit periode melalui `PeriodWizardDialog`.
- `session.user.id` (dari Better Auth) adalah string unik per akun.

**Tidak ada perubahan skema DB / migrasi** — memanfaatkan kolom `partnerUserId` yang sudah ada.

---

## Gap Analysis

| Komponen | Status | Task |
|---|---|---|
| Query filter `profit_shares WHERE partner_user_id = $userId` + akumulasi total | ✅ Selesai | Task 1 |
| Pure function `extractMyShares(periods, userId)` | ✅ Selesai | Task 2 |
| Kartu sorotan "Hak Dividen Anda" di `PartnerProfitSharingView` | ✅ Selesai | Task 3 |
| Prop `myPayoutAmount` ke `PeriodCard` untuk highlighting baris personal | ✅ Selesai | Task 3 |
| Pass `session.user.id` dari `profit-sharing/page.tsx` ke `PartnerProfitSharingView` | ✅ Selesai | Task 4 |


---

## Batasan Arsitektur (Technical Constitution)

- **Security (Deny-by-Default):** `session.user.id` HANYA dibaca dari server-side session (`getCurrentSession()`) — tidak pernah diterima dari client input / URL param. Tidak ada risiko spoofing.
- **Testability-First:** `extractMyShares(periods, userId)` adalah **pure function** — tanpa I/O, dapat ditest tanpa mock DB.
- **No DB Migration:** Kolom `partnerUserId` sudah ada. Hanya menambah query filter dan logika presentasi.
- **Graceful Degradation:** Jika `userId` adalah `undefined` atau tidak ada share yang match, komponen merender tampilan generik — tidak error.
- **RSC Boundary:** Seluruh data fetching tetap di Server Component. Highlighting adalah logika presentasi yang diteruskan via props.

---

## Task 1: Query Akumulasi Dividen Personal

**Files:**
- Modify: `features/profit-sharing/profit-sharing.queries.ts`
- Test: `domain/__tests__/profit-sharing-actions.test.ts`

**Acceptance Criteria:**
1. Fungsi `getMyTotalDividend(userId)` → `number` (total akumulasi `payoutAmount` dari semua share dengan `partnerUserId === userId` di periode `finalized`).
2. Jika `userId` adalah falsy atau tidak ada share yang cocok → return `0`.
3. Hanya menghitung periode dengan `status = "finalized"` (bukan draft).

**Functional Requirements:**
1. Query join antara `profitShares` dan `profitSharingPeriods` dengan filter `partnerUserId` dan `status = "finalized"`.
2. Mengembalikan tipe `number` (float) — bukan string numeric.

**Step 1: Write failing test (RED)**

Tambahkan ke `domain/__tests__/profit-sharing-actions.test.ts`:

```typescript
describe("getMyTotalDividend", () => {
  it("harus mengembalikan angka number", async () => {
    // Mock sudah ada di file ini — adjust mockResolvedValueOnce sesuai struktur mock
    const { getMyTotalDividend } = await import(
      "@/features/profit-sharing/profit-sharing.queries"
    )
    const result = await getMyTotalDividend("user-test-123")
    expect(typeof result).toBe("number")
  })

  it("harus mengembalikan 0 jika userId kosong", async () => {
    const { getMyTotalDividend } = await import(
      "@/features/profit-sharing/profit-sharing.queries"
    )
    const result = await getMyTotalDividend("")
    expect(result).toBe(0)
  })
})
```

**Step 2: Verify test fails**
```bash
pnpm test domain/__tests__/profit-sharing-actions.test.ts
```
Expected: FAIL — `getMyTotalDividend is not a function`

**Step 3: Write minimal implementation (GREEN)**

Tambahkan ke akhir `features/profit-sharing/profit-sharing.queries.ts`:

```typescript
/**
 * Menghitung total akumulasi dividen untuk investor tertentu
 * berdasarkan partner_user_id di seluruh periode yang sudah finalized.
 */
export async function getMyTotalDividend(userId: string): Promise<number> {
  if (!userId) return 0

  const [result] = await db
    .select({
      total: sql<number>`coalesce(sum(${profitShares.payoutAmount}::numeric), 0)::float`,
    })
    .from(profitShares)
    .innerJoin(
      profitSharingPeriods,
      eq(profitShares.periodId, profitSharingPeriods.id)
    )
    .where(
      and(
        eq(profitShares.partnerUserId, userId),
        eq(profitSharingPeriods.status, "finalized")
      )
    )

  return result?.total ?? 0
}
```

> **Catatan:** Import `innerJoin` perlu ditambahkan dari `drizzle-orm` jika belum ada. Periksa import existing di file.

**Step 4: Verify test passes**
```bash
pnpm test domain/__tests__/profit-sharing-actions.test.ts
```
Expected: PASS — seluruh test (lama + 2 baru) hijau

---

## Task 2: Pure Function — `extractMyShares()`

**Files:**
- Create: `domain/investor-personalization.ts`
- Test: `domain/__tests__/investor-personalization.test.ts`

**Acceptance Criteria:**
1. `extractMyShares(periods, userId)` → `Map<string, PayoutAmount>` — map dari `periodId` ke nominal `payoutAmount` hak investor tersebut.
2. Jika `userId` adalah falsy → return `Map` kosong.
3. Jika tidak ada share yang match → return `Map` kosong.
4. Fungsi adalah **pure** — tanpa I/O, tanpa side-effect.

**Step 1: Write failing test (RED)**

Buat file baru `domain/__tests__/investor-personalization.test.ts`:

```typescript
import { describe, expect, it } from "vitest"

import { extractMyShares } from "@/domain/investor-personalization"

const mockPeriods = [
  {
    id: "period-1",
    shares: [
      { periodId: "period-1", partnerUserId: "user-hadid", partnerName: "Hadid", payoutAmount: "5000000", capitalShare: "4000000", sharePercentage: "0.006897", notes: null },
      { periodId: "period-1", partnerUserId: "user-alfiah", partnerName: "Alfiah", payoutAmount: "43000000", capitalShare: "50000000", sharePercentage: "0.086207", notes: null },
    ],
  },
  {
    id: "period-2",
    shares: [
      { periodId: "period-2", partnerUserId: "user-hadid", partnerName: "Hadid", payoutAmount: "6000000", capitalShare: "4000000", sharePercentage: "0.006897", notes: null },
    ],
  },
]

describe("extractMyShares", () => {
  it("returns empty Map for empty userId", () => {
    const result = extractMyShares(mockPeriods as never, "")
    expect(result.size).toBe(0)
  })

  it("returns empty Map for userId with no matching shares", () => {
    const result = extractMyShares(mockPeriods as never, "user-unknown")
    expect(result.size).toBe(0)
  })

  it("returns Map with periodId -> payoutAmount for matching userId", () => {
    const result = extractMyShares(mockPeriods as never, "user-hadid")
    expect(result.size).toBe(2)
    expect(result.get("period-1")).toBe(5_000_000)
    expect(result.get("period-2")).toBe(6_000_000)
  })

  it("only includes shares matching the given userId", () => {
    const result = extractMyShares(mockPeriods as never, "user-alfiah")
    expect(result.size).toBe(1)
    expect(result.get("period-1")).toBe(43_000_000)
    expect(result.has("period-2")).toBe(false)
  })

  it("handles periods with no shares array gracefully", () => {
    const periodsWithEmpty = [{ id: "period-3", shares: [] }]
    const result = extractMyShares(periodsWithEmpty as never, "user-hadid")
    expect(result.size).toBe(0)
  })
})
```

**Step 2: Verify test fails**
```bash
pnpm test domain/__tests__/investor-personalization.test.ts
```
Expected: FAIL — `Cannot find module '@/domain/investor-personalization'`

**Step 3: Write minimal implementation (GREEN)**

```typescript
// domain/investor-personalization.ts
import type { ProfitSharingPeriodDetail } from "@/features/profit-sharing/profit-sharing.queries"

/**
 * Extracts a map of { periodId -> payoutAmount } for the given investor userId.
 * Pure function — no I/O, no side effects.
 *
 * @param periods - Array of finalized periods with their shares
 * @param userId  - The authenticated investor's user ID
 * @returns Map<periodId, payoutAmount> only for the matching investor
 */
export function extractMyShares(
  periods: ProfitSharingPeriodDetail[],
  userId: string
): Map<string, number> {
  const result = new Map<string, number>()
  if (!userId) return result

  for (const period of periods) {
    const myShare = period.shares.find(
      (share) => share.partnerUserId === userId
    )
    if (myShare) {
      result.set(period.id, parseFloat(myShare.payoutAmount))
    }
  }

  return result
}
```

**Step 4: Verify test passes**
```bash
pnpm test domain/__tests__/investor-personalization.test.ts
```
Expected: PASS — 5/5 tests hijau

---

## Task 3: Penyempurnaan UI — `PartnerProfitSharingView` & `PeriodCard`

**Files:**
- Modify: `features/profit-sharing/partner-profit-sharing-view.tsx`
- Modify: `features/profit-sharing/period-card.tsx`

**Acceptance Criteria:**
1. `PartnerProfitSharingView` menerima prop baru `userId?: string` dan `myTotalDividend?: number`.
2. Jika `userId` ada dan `myTotalDividend > 0`, tampilkan kartu sorotan "Hak Dividen Anda" berwarna emerald di atas stat cards yang sudah ada.
3. `PeriodCard` menerima prop baru opsional `myPayoutAmount?: number`.
4. Jika `myPayoutAmount` ada (> 0), tampilkan baris highlight khusus di dalam card: *"Hak Anda: Rp X.XXX.XXX"* dengan styling emerald yang mencolok.
5. Jika `userId` tidak ada atau tidak ada share yang match → UI tetap identik seperti sebelumnya (graceful degradation).

**Functional Requirements:**

**Modifikasi `partner-profit-sharing-view.tsx`:**
- Tambah prop `userId?: string` dan `myTotalDividend: number` ke interface.
- Render kartu sorotan kondisional:

```typescript
// Tambah props ke interface:
interface PartnerProfitSharingViewProps {
  user?: {
    name?: string | null
    email?: string | null
  }
  userId?: string          // Tambah ini
  myTotalDividend?: number // Tambah ini
  mySharesMap?: Map<string, number> // Tambah ini
}

// Kartu sorotan (render kondisional sebelum stat cards existing):
{myTotalDividend !== undefined && myTotalDividend > 0 && (
  <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          Total Hak Dividen Anda (All-Time)
        </p>
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
          {formatCurrency(myTotalDividend)}
        </p>
      </div>
      <RiHandCoinLine className="size-8 text-emerald-500/60" />
    </div>
    <p className="mt-1.5 text-xs text-muted-foreground">
      Akumulasi dividen dari seluruh periode yang sudah finalized
    </p>
  </div>
)}
```

- Pass `myPayoutAmount={mySharesMap?.get(period.id)}` ke setiap `<PeriodCard>`.

**Modifikasi `period-card.tsx`:**
- Tambah prop `myPayoutAmount?: number` ke `PeriodCardProps`.
- Tampilkan badge/row sorotan kondisional di dalam card:

```typescript
// Tambah ke PeriodCardProps:
interface PeriodCardProps {
  period: ProfitSharingPeriodDetail
  readOnly?: boolean
  myPayoutAmount?: number // Tambah ini
}

// Di dalam CardContent atau CardFooter (setelah elemen existing):
{myPayoutAmount !== undefined && myPayoutAmount > 0 && (
  <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2">
    <div className="flex items-center gap-1.5">
      <RiHandCoinLine className="size-3.5 text-emerald-500" />
      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
        Hak Anda
      </span>
    </div>
    <span className="tabular-nums text-sm font-bold text-emerald-600 dark:text-emerald-400">
      {formatCurrency(myPayoutAmount)}
    </span>
  </div>
)}
```

**Non-Functional Requirements:**
- Tidak ada `useEffect` atau client-side fetch.
- Semua komponen yang dimodifikasi tetap kompatibel dengan tampilan Admin (tidak ada breaking change — prop baru bersifat opsional).

**Test Coverage:**
- TypeScript check: `pnpm exec tsc --noEmit` — 0 error (memverifikasi prop types baru tidak merusak existing callers).

**Step 3: Write implementation**

Modifikasi kedua file sesuai spesifikasi di atas.

**Step 4: Verify**
```bash
pnpm exec tsc --noEmit
```
Expected: 0 TypeScript errors

---

## Task 4: Integrasi di Server Component `profit-sharing/page.tsx`

**Files:**
- Modify: `app/(dashboard)/profit-sharing/page.tsx`

**Acceptance Criteria:**
1. Saat `!userIsAdmin` (investor login), `session.user.id` di-extract dari session dan diteruskan ke `PartnerProfitSharingView`.
2. `getMyTotalDividend(userId)` dipanggil paralel bersama `listProfitSharingPeriodsWithShares()`.
3. `extractMyShares(finalizedPeriods, userId)` dipanggil sebagai pure function (no await) untuk menghasilkan `mySharesMap`.
4. Semua prop baru diteruskan ke `<PartnerProfitSharingView>`.

**Step 3: Write minimal implementation (GREEN)**

Ganti blok `if (!userIsAdmin)` di `profit-sharing/page.tsx`:

```typescript
// Tambah import baru di atas:
import { extractMyShares } from "@/domain/investor-personalization"
import {
  getMyTotalDividend,
  listProfitSharingPeriodsWithShares,
} from "@/features/profit-sharing/profit-sharing.queries"

// Ganti blok if (!userIsAdmin):
if (!userIsAdmin) {
  const userId = session?.user?.id ?? ""

  const [allPeriods, myTotalDividend] = await Promise.all([
    listProfitSharingPeriodsWithShares(),
    getMyTotalDividend(userId),
  ])

  const finalizedPeriods = allPeriods.filter((p) => p.status === "finalized")
  const mySharesMap = extractMyShares(finalizedPeriods, userId)

  return (
    <PartnerProfitSharingView
      user={session?.user}
      userId={userId}
      myTotalDividend={myTotalDividend}
      mySharesMap={mySharesMap}
    />
  )
}
```

> **Catatan:** `PartnerProfitSharingView` tidak lagi melakukan fetch internal sendiri — data periods diteruskan dari page. Ini memerlukan refactor kecil: hapus `listProfitSharingPeriodsWithShares()` dari dalam `PartnerProfitSharingView` dan terima sebagai prop `periods`.

**Revisi Props `PartnerProfitSharingView`:**

```typescript
interface PartnerProfitSharingViewProps {
  user?: { name?: string | null; email?: string | null }
  userId?: string
  myTotalDividend?: number
  mySharesMap?: Map<string, number>
  periods: ProfitSharingPeriodDetail[]   // Baru — receive from page
}
```

**Step 4: Verify final**
```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm build && pnpm test
```
Expected: Semua PASS — 0 error TS, 0 lint warning, build sukses, seluruh unit test hijau.

---

## Verification Plan Final

| Langkah | Perintah / Cara | Ekspektasi |
|---|---|---|
| Unit Tests | `pnpm test` | Semua test hijau (≥ 7 test baru dari Task 1 & 2) |
| TypeScript | `pnpm exec tsc --noEmit` | 0 error |
| Linter | `pnpm lint` | 0 error, 0 warning |
| Build | `pnpm build` | Build sukses |
| Manual (admin) | Login sebagai admin → buka `/profit-sharing` | Tampilan admin tidak berubah sama sekali |
| Manual (investor dengan link) | Login sebagai investor yang `partnerUserId` sudah diisi → buka `/profit-sharing` | Kartu "Hak Dividen Anda" emerald muncul + highlight baris di setiap period card |
| Manual (investor tanpa link) | Login sebagai investor tanpa `partnerUserId` → buka `/profit-sharing` | Tampilan investor generik seperti semula, tanpa error |

---

## Catatan Penting: Linking Investor ke `partnerUserId`

Agar fitur ini bekerja, Admin (Mas Hafidz) perlu mengisi field `partnerUserId` saat membuat periode bagi hasil di `PeriodWizardDialog`. Field ini sudah tersedia di form — hanya perlu diisi dengan `user.id` masing-masing investor (bisa dicek dari database atau panel admin).

Jika diperlukan, di masa depan bisa ditambahkan dropdown autocomplete untuk memilih user saat mengisi form partner (Plan masa depan — bukan bagian dari Plan #11 ini).

---

*Setelah plan disetujui, jalankan `/scaffold-execute` untuk eksekusi Task per Task.*
