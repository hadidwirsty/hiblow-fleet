# Plan #9: Visualisasi Grafik Pengelompokan Biaya per Kategori

**Tanggal:** 2026-09-11
**Fitur:** Expense Category Breakdown Chart (Docs 02 No. 2.4 — Should Have)
**Status:** Completed (Executed on 2026-09-14)

---

## Ringkasan Fitur

Menambahkan visualisasi interaktif berupa **Donut Chart (PieChart)** di halaman `/expenses` untuk memperlihatkan komposisi proporsi pengeluaran per kategori armada. Pengguna (Admin) dapat segera mengetahui:
- Kategori biaya apa yang paling besar (Servis, Onderdil, BBM, DP/Cicilan, dll.)
- Proporsi persentase masing-masing kategori terhadap total beban
- Filter aktif halaman (bulan, tahun, truckId) otomatis memengaruhi data chart

**Library:** Recharts `^3.8.0` — sudah terpasang, tidak perlu install baru.
**Dependensi Plan Sebelumnya:** Plan #3 (expenses module), Plan #7 (export)

---

## Gap Analysis

| Komponen | Status | Task |
|---|---|---|
| Query `GROUP BY category` (`getExpensesCategoryBreakdown`) | ✅ Selesai | Task 1 |
| `CategoryBreakdownItem` type | ✅ Selesai | Task 1 |
| Pure transformer `prepareCategoryChartData()` | ✅ Selesai | Task 2 |
| `ExpensesCategoryChart` component (Recharts PieChart) | ✅ Selesai | Task 3 |
| Integrasi chart ke `expenses/page.tsx` | ✅ Selesai | Task 4 |


---

## Batasan Arsitektur (Technical Constitution)

- **Testability-First:** `prepareCategoryChartData` adalah pure function — ditest unit secara independen di `domain/__tests__/`.
- **RSC → Client Boundary:** Query dipanggil di Server Component (`page.tsx`), data dipass sebagai props ke Client Component `"use client"` chart.
- **No Migration Needed:** Tidak ada perubahan skema DB.
- **Filter Propagation:** Chart menggunakan filter yang sama dengan tabel & summary yang sudah ada.

---

## Task 1: Query Agregasi Biaya per Kategori

**Files:**
- Modify: `features/expenses/expenses.queries.ts`
- Test: `domain/__tests__/expenses-queries.test.ts`

**Acceptance Criteria:**
1. `getExpensesCategoryBreakdown(filter)` → `CategoryBreakdownItem[]` berisi `category`, `total`, `count`.
2. Filter `truckId`, `month`, `year` berfungsi identik dengan `listExpenses`.
3. Kategori dengan total 0 tidak dimasukkan ke hasil.
4. Hasil diurutkan dari `total` terbesar ke terkecil.

**Step 1: Write failing test (RED)**

Tambahkan ke `domain/__tests__/expenses-queries.test.ts`:

```typescript
it("getExpensesCategoryBreakdown should return array", async () => {
  const { getExpensesCategoryBreakdown } = await import(
    "@/features/expenses/expenses.queries"
  )
  const result = await getExpensesCategoryBreakdown({})
  expect(Array.isArray(result)).toBe(true)
})

it("getExpensesCategoryBreakdown should accept truckId filter", async () => {
  const { getExpensesCategoryBreakdown } = await import(
    "@/features/expenses/expenses.queries"
  )
  const result = await getExpensesCategoryBreakdown({ truckId: "W8187UA" })
  expect(Array.isArray(result)).toBe(true)
})

it("getExpensesCategoryBreakdown items should have category, total, count", async () => {
  const { getExpensesCategoryBreakdown } = await import(
    "@/features/expenses/expenses.queries"
  )
  const result = await getExpensesCategoryBreakdown({})
  if (result.length > 0) {
    expect(result[0]).toHaveProperty("category")
    expect(result[0]).toHaveProperty("total")
    expect(result[0]).toHaveProperty("count")
  }
})
```

**Step 2: Verify test fails**
```bash
pnpm test domain/__tests__/expenses-queries.test.ts
```
Expected: FAIL — `getExpensesCategoryBreakdown is not a function`

**Step 3: Write minimal implementation (GREEN)**

Tambahkan ke akhir `features/expenses/expenses.queries.ts`:

```typescript
export interface CategoryBreakdownItem {
  category: string
  total: number
  count: number
}

export async function getExpensesCategoryBreakdown(
  filter: ListExpensesFilter = {}
): Promise<CategoryBreakdownItem[]> {
  const conditions = []

  if (filter.truckId) {
    conditions.push(eq(expenses.truckId, filter.truckId))
  }

  if (filter.month && filter.year) {
    conditions.push(
      sql`EXTRACT(MONTH FROM ${expenses.expenseDate}) = ${filter.month}`,
      sql`EXTRACT(YEAR FROM ${expenses.expenseDate}) = ${filter.year}`
    )
  }

  return db
    .select({
      category: expenses.category,
      total: sql<number>`coalesce(sum(${expenses.amount}::numeric + ${expenses.adminFee}::numeric), 0)::float`,
      count: sql<number>`count(*)::int`,
    })
    .from(expenses)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(expenses.category)
    .orderBy(
      sql`sum(${expenses.amount}::numeric + ${expenses.adminFee}::numeric) DESC`
    )
}
```

**Step 4: Verify test passes**
```bash
pnpm test domain/__tests__/expenses-queries.test.ts
```
Expected: PASS — 5/5 tests pass (3 baru + 2 lama)

---

## Task 2: Pure Domain Transformer — `prepareCategoryChartData()`

**Files:**
- Create: `domain/expense-category.ts`
- Test: `domain/__tests__/expense-category.test.ts`

**Acceptance Criteria:**
1. `prepareCategoryChartData(items, totalExpenses)` → `ChartCategoryItem[]` dengan field tambahan `percentage` dan `fill`.
2. `percentage = (item.total / totalExpenses) * 100`, rounded 1 decimal.
3. Jika `totalExpenses === 0`, semua `percentage` bernilai `0`.
4. `fill` adalah warna HSL tetap per kategori (tidak random).
5. Fungsi adalah **pure** — tanpa I/O, tanpa side-effect.

**Palette Warna Kategori:**
- `Servis` → `hsl(25, 90%, 55%)` (oranye)
- `Onderdil` → `hsl(210, 80%, 55%)` (biru)
- `BBM` → `hsl(45, 95%, 50%)` (kuning)
- `GPS` → `hsl(260, 70%, 60%)` (ungu)
- `DP/Cicilan` → `hsl(340, 75%, 55%)` (merah-muda)
- `Administrasi` → `hsl(160, 60%, 45%)` (hijau-teal)
- `Lainnya` → `hsl(0, 0%, 60%)` (abu-abu)

**Step 1: Write failing test (RED)**

Buat file baru `domain/__tests__/expense-category.test.ts`:

```typescript
import { describe, expect, it } from "vitest"

import { prepareCategoryChartData } from "@/domain/expense-category"

describe("prepareCategoryChartData", () => {
  it("returns empty array for empty input", () => {
    expect(prepareCategoryChartData([], 0)).toEqual([])
  })

  it("returns 100% for single item", () => {
    const result = prepareCategoryChartData(
      [{ category: "Servis", total: 500000, count: 1 }],
      500000
    )
    expect(result[0].percentage).toBe(100.0)
  })

  it("percentages sum to ~100 for multiple items", () => {
    const items = [
      { category: "Servis", total: 600000, count: 2 },
      { category: "BBM", total: 400000, count: 1 },
    ]
    const result = prepareCategoryChartData(items, 1000000)
    const sum = result.reduce((acc, item) => acc + item.percentage, 0)
    expect(sum).toBeCloseTo(100, 0)
  })

  it("returns percentage 0 when totalExpenses is 0", () => {
    const result = prepareCategoryChartData(
      [{ category: "Servis", total: 0, count: 0 }],
      0
    )
    expect(result[0].percentage).toBe(0)
  })

  it("each item has a non-empty fill string property", () => {
    const result = prepareCategoryChartData(
      [{ category: "Servis", total: 500000, count: 1 }],
      500000
    )
    expect(typeof result[0].fill).toBe("string")
    expect(result[0].fill.length).toBeGreaterThan(0)
  })
})
```

**Step 2: Verify test fails**
```bash
pnpm test domain/__tests__/expense-category.test.ts
```
Expected: FAIL — `Cannot find module '@/domain/expense-category'`

**Step 3: Write minimal implementation (GREEN)**

```typescript
// domain/expense-category.ts
import type { CategoryBreakdownItem } from "@/features/expenses/expenses.queries"

const CATEGORY_COLORS: Record<string, string> = {
  Servis: "hsl(25, 90%, 55%)",
  Onderdil: "hsl(210, 80%, 55%)",
  BBM: "hsl(45, 95%, 50%)",
  GPS: "hsl(260, 70%, 60%)",
  "DP/Cicilan": "hsl(340, 75%, 55%)",
  Administrasi: "hsl(160, 60%, 45%)",
  Lainnya: "hsl(0, 0%, 60%)",
}

const DEFAULT_COLOR = "hsl(0, 0%, 70%)"

export interface ChartCategoryItem extends CategoryBreakdownItem {
  percentage: number
  fill: string
}

export function prepareCategoryChartData(
  items: CategoryBreakdownItem[],
  totalExpenses: number
): ChartCategoryItem[] {
  return items.map((item) => ({
    ...item,
    percentage:
      totalExpenses > 0
        ? parseFloat(((item.total / totalExpenses) * 100).toFixed(1))
        : 0,
    fill: CATEGORY_COLORS[item.category] ?? DEFAULT_COLOR,
  }))
}
```

**Step 4: Verify test passes**
```bash
pnpm test domain/__tests__/expense-category.test.ts
```
Expected: PASS — 5/5 tests hijau

---

## Task 3: Komponen Chart — `ExpensesCategoryChart`

**Files:**
- Create: `features/expenses/expenses-category-chart.tsx`

**Acceptance Criteria:**
1. Render `PieChart` (donut style, `innerRadius=70`) dari Recharts.
2. Legend tabel di bawah chart: nama kategori + nominal + persentase.
3. Empty-state jika `data.length === 0` atau `totalExpenses === 0`.
4. Custom Tooltip saat hover: nama, nominal, persentase.
5. `ResponsiveContainer width="100%" height={280}`.

**Step 3: Write implementation (GREEN)**

```typescript
// features/expenses/expenses-category-chart.tsx
"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import type { ChartCategoryItem } from "@/domain/expense-category"
import { formatCurrency } from "@/lib/utils"

interface ExpensesCategoryChartProps {
  data: ChartCategoryItem[]
  totalExpenses: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ChartCategoryItem }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-sm">
      <p className="font-semibold text-foreground">{item.category}</p>
      <p className="text-muted-foreground">{formatCurrency(item.total)}</p>
      <p className="text-xs text-muted-foreground">
        {item.percentage}% dari total
      </p>
    </div>
  )
}

export function ExpensesCategoryChart({
  data,
  totalExpenses,
}: ExpensesCategoryChartProps) {
  if (data.length === 0 || totalExpenses === 0) {
    return (
      <div className="flex h-70 items-center justify-center rounded-xl border border-dashed">
        <p className="text-sm text-muted-foreground">
          Tidak ada data pengeluaran untuk ditampilkan
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            dataKey="total"
            nameKey="category"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend table */}
      <div className="space-y-1.5">
        {data.map((item) => (
          <div
            key={item.category}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="font-medium text-foreground">
                {item.category}
              </span>
            </div>
            <div className="flex items-center gap-3 text-right">
              <span className="tabular-nums text-muted-foreground">
                {formatCurrency(item.total)}
              </span>
              <span className="w-12 tabular-nums text-xs font-semibold text-foreground">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
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

## Task 4: Integrasi ke Halaman `/expenses`

**Files:**
- Modify: `app/(dashboard)/expenses/page.tsx`

**Acceptance Criteria:**
1. Section grafik muncul di antara `<ExpensesSummary>` dan `<ExpensesTable>`.
2. Data chart menggunakan filter yang sama (truckId, month, year).
3. Chart dibungkus dalam `Card` dengan judul "Komposisi Biaya per Kategori".
4. Query chart dijalankan paralel via `Promise.all` (tidak waterfall).
5. Halaman tetap React Server Component.

**Step 3: Write implementation (GREEN)**

Modifikasi `app/(dashboard)/expenses/page.tsx`:

```typescript
// Tambah import baru:
import { prepareCategoryChartData } from "@/domain/expense-category"
import { ExpensesCategoryChart } from "@/features/expenses/expenses-category-chart"
import {
  getExpensesCategoryBreakdown,  // Tambah ini
  getExpensesSummary,
  listExpenses,
} from "@/features/expenses/expenses.queries"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Update Promise.all:
const [expensesData, summary, breakdown] = await Promise.all([
  listExpenses(filter),
  getExpensesSummary(filter),
  getExpensesCategoryBreakdown(filter),
])

const chartData = prepareCategoryChartData(breakdown, summary.totalExpenses)

// Tambah section di antara ExpensesSummary dan tabel:
{/* Category Breakdown Chart */}
<div className="px-4 lg:px-6">
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-semibold">
        Komposisi Biaya per Kategori
      </CardTitle>
      <CardDescription className="text-xs">
        Proporsi pengeluaran berdasarkan jenis biaya operasional armada
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ExpensesCategoryChart
        data={chartData}
        totalExpenses={summary.totalExpenses}
      />
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

## Verification Plan Final

| Langkah | Perintah | Ekspektasi |
|---|---|---|
| Unit Tests | `pnpm test` | Semua test hijau (≥ 8 test baru dari Task 1 & 2) |
| TypeScript | `pnpm exec tsc --noEmit` | 0 error |
| Linter | `pnpm lint` | 0 error, 0 warning |
| Build | `pnpm build` | Build sukses dalam < 15s |
| Manual (browser) | Buka `/expenses` di browser | Chart donut tampil, legend tabel akurat, filter bulan/truk berfungsi |

---

*Setelah plan disetujui, jalankan `/scaffold-execute` untuk eksekusi Task per Task.*
