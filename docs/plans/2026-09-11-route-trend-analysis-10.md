# Plan #10: Analisis Tren Omset & Frekuensi per Rute/Pabrik

**Tanggal:** 2026-09-11
**Fitur:** Route Trend Analysis — Top Routes by Frequency & Omset (Docs 02 No. 2.5 — Should Have)
**Status:** Completed (Executed on 2026-09-14)

---

## Ringkasan Fitur

Menambahkan widget analitik **"Top Rute Teratas"** di halaman `/dashboard` yang memperlihatkan:
- Rute mana yang paling sering dioperasikan (ritase terbanyak)
- Kontribusi omset dan laba bersih tertinggi per rute/pabrik tujuan
- Perbandingan klien: Semen Indonesia (SI), SBI, Indocement Grobogan, dll.

**Representasi visual:**
- **Horizontal Bar Chart** (Recharts `BarChart` horizontal) untuk peringkat ritase per rute — mudah dibaca di layar mobile.
- **Tabel ringkas** di bawah chart: destinasi, ritase, total omset, rata-rata omset/rit.

Filter **month/year** aktif di dashboard otomatis memengaruhi data widget ini.

**Library:** Recharts `^3.8.0` — sudah terpasang, tidak perlu install baru.
**Dependensi Plan Sebelumnya:** Plan #2 (trips module), Plan #5 (auth dashboard).

---

## Gap Analysis

| Komponen | Status | Task |
|---|---|---|
| Query `GROUP BY destinationCity` dengan agregasi omset & profit | ✅ Selesai | Task 1 |
| `RouteBreakdownItem` type | ✅ Selesai | Task 1 |
| Pure transformer `prepareRouteChartData()` (truncate label panjang) | ✅ Selesai | Task 2 |
| `DashboardRouteChart` component (Horizontal BarChart Recharts) | ✅ Selesai | Task 3 |
| Integrasi widget ke `dashboard/page.tsx` | ✅ Selesai | Task 4 |


---

## Batasan Arsitektur (Technical Constitution)

- **Testability-First:** `prepareRouteChartData` adalah pure function — ditest unit tanpa I/O.
- **RSC → Client Boundary:** `getTopRoutes()` dipanggil di Server Component (`dashboard/page.tsx`). Data dipass sebagai props ke Client Component `"use client"` chart.
- **Grouping Strategy:** Gunakan `destinationCity` sebagai dimensi utama grouping (bukan `destinationName` karena terlalu granular — satu kota bisa punya puluhan tujuan spesifik).
- **Filter Month/Year:** Query harus support filter bulan/tahun via `unloadingDate` (sama dengan KPI cards yang sudah ada).
- **No DB Migration:** Tidak ada perubahan skema DB, murni query agregasi.
- **Top N:** Tampilkan maksimal **10 rute teratas** berdasarkan frekuensi ritase (`COUNT(*) DESC`).

---

## Task 1: Query Agregasi Rute Teratas

**Files:**
- Modify: `features/dashboard/dashboard.queries.ts`
- Test: `domain/__tests__/dashboard-queries.test.ts`

**Acceptance Criteria:**
1. `getTopRoutes(month, year, limit?)` → `RouteBreakdownItem[]` berisi: `destinationCity`, `tripCount`, `totalOmset`, `totalProfit`, `avgOmset`.
2. Filter `month` & `year` menggunakan `unloadingDate` (konsisten dengan `getDashboardKPIs`).
3. Hasil diurutkan dari `tripCount` terbesar ke terkecil.
4. Parameter `limit` opsional, default `10`.
5. Ketika `month` dan `year` adalah `0` / tidak difilter → kembalikan data all-time.

**Functional Requirements:**
1. Query menggunakan Drizzle ORM dengan GROUP BY `trips.destinationCity`.
2. `avgOmset = totalOmset / tripCount` (dihitung di DB dengan `AVG()`).
3. Semua field numerik menggunakan `::float` casting untuk konsistensi dengan query lain.

**Step 1: Write failing test (RED)**

Tambahkan ke `domain/__tests__/dashboard-queries.test.ts`:

```typescript
describe("getTopRoutes", () => {
  it("harus mengembalikan array RouteBreakdownItem", async () => {
    mockFromWhere.mockResolvedValueOnce([
      {
        destinationCity: "TUBAN",
        tripCount: 15,
        totalOmset: 75_000_000,
        totalProfit: 30_000_000,
        avgOmset: 5_000_000,
      },
    ])

    const { getTopRoutes } = await import(
      "@/features/dashboard/dashboard.queries"
    )
    const result = await getTopRoutes(9, 2026)
    expect(Array.isArray(result)).toBe(true)
  })

  it("setiap item harus memiliki destinationCity, tripCount, totalOmset, totalProfit, avgOmset", async () => {
    mockFromWhere.mockResolvedValueOnce([
      {
        destinationCity: "TUBAN",
        tripCount: 15,
        totalOmset: 75_000_000,
        totalProfit: 30_000_000,
        avgOmset: 5_000_000,
      },
    ])

    const { getTopRoutes } = await import(
      "@/features/dashboard/dashboard.queries"
    )
    const result = await getTopRoutes(9, 2026)
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("destinationCity")
      expect(result[0]).toHaveProperty("tripCount")
      expect(result[0]).toHaveProperty("totalOmset")
      expect(result[0]).toHaveProperty("totalProfit")
      expect(result[0]).toHaveProperty("avgOmset")
    }
  })

  it("harus menerima parameter limit opsional", async () => {
    mockFromWhere.mockResolvedValueOnce([])
    const { getTopRoutes } = await import(
      "@/features/dashboard/dashboard.queries"
    )
    const result = await getTopRoutes(9, 2026, 5)
    expect(Array.isArray(result)).toBe(true)
  })
})
```

**Step 2: Verify test fails**
```bash
pnpm test domain/__tests__/dashboard-queries.test.ts
```
Expected: FAIL — `getTopRoutes is not a function`

**Step 3: Write minimal implementation (GREEN)**

Tambahkan ke akhir `features/dashboard/dashboard.queries.ts`:

```typescript
export interface RouteBreakdownItem {
  destinationCity: string
  tripCount: number
  totalOmset: number
  totalProfit: number
  avgOmset: number
}

export async function getTopRoutes(
  month: number,
  year: number,
  limit = 10
): Promise<RouteBreakdownItem[]> {
  const conditions = []

  if (month > 0 && year > 0) {
    conditions.push(
      sql`EXTRACT(MONTH FROM ${trips.unloadingDate}) = ${month}`,
      sql`EXTRACT(YEAR FROM ${trips.unloadingDate}) = ${year}`
    )
  }

  return db
    .select({
      destinationCity: trips.destinationCity,
      tripCount: sql<number>`count(*)::int`,
      totalOmset: sql<number>`coalesce(sum(${trips.omset}::numeric), 0)::float`,
      totalProfit: sql<number>`coalesce(sum(${trips.profit}::numeric), 0)::float`,
      avgOmset: sql<number>`coalesce(avg(${trips.omset}::numeric), 0)::float`,
    })
    .from(trips)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(trips.destinationCity)
    .orderBy(sql`count(*) DESC`)
    .limit(limit)
}
```

> **Catatan:** Import `and` sudah tersedia di file karena dipakai di `getDashboardKPIs`.

**Step 4: Verify test passes**
```bash
pnpm test domain/__tests__/dashboard-queries.test.ts
```
Expected: PASS — seluruh test (lama + 3 baru) hijau

---

## Task 2: Pure Domain Transformer — `prepareRouteChartData()`

**Files:**
- Create: `domain/route-trend.ts`
- Test: `domain/__tests__/route-trend.test.ts`

**Acceptance Criteria:**
1. `prepareRouteChartData(items)` → `ChartRouteItem[]` dengan field tambahan:
   - `label`: Label singkat kota (max 12 karakter, potong + "…" jika lebih).
   - `omsetJuta`: `totalOmset / 1_000_000` dibulatkan 1 decimal (satuan Juta Rupiah, untuk sumbu chart yang ringkas).
   - `profitJuta`: `totalProfit / 1_000_000` dibulatkan 1 decimal.
2. Jika `items` kosong → return array kosong.
3. Fungsi adalah **pure** — tanpa I/O, tanpa side-effect.
4. Urutan item dipertahankan dari input.

**Step 1: Write failing test (RED)**

Buat file baru `domain/__tests__/route-trend.test.ts`:

```typescript
import { describe, expect, it } from "vitest"

import { prepareRouteChartData } from "@/domain/route-trend"

const sampleItems = [
  {
    destinationCity: "TUBAN",
    tripCount: 15,
    totalOmset: 75_000_000,
    totalProfit: 30_000_000,
    avgOmset: 5_000_000,
  },
  {
    destinationCity: "GROBOGAN",
    tripCount: 10,
    totalOmset: 50_000_000,
    totalProfit: 20_000_000,
    avgOmset: 5_000_000,
  },
]

describe("prepareRouteChartData", () => {
  it("returns empty array for empty input", () => {
    expect(prepareRouteChartData([])).toEqual([])
  })

  it("adds label field to each item", () => {
    const result = prepareRouteChartData(sampleItems)
    expect(result[0]).toHaveProperty("label")
    expect(typeof result[0].label).toBe("string")
  })

  it("adds omsetJuta as totalOmset / 1_000_000 rounded 1 decimal", () => {
    const result = prepareRouteChartData(sampleItems)
    expect(result[0].omsetJuta).toBe(75.0)
  })

  it("adds profitJuta as totalProfit / 1_000_000 rounded 1 decimal", () => {
    const result = prepareRouteChartData(sampleItems)
    expect(result[0].profitJuta).toBe(30.0)
  })

  it("truncates label longer than 12 chars with ellipsis", () => {
    const longNameItems = [
      {
        destinationCity: "INDOCEMENT GROBOGAN SANGAT PANJANG",
        tripCount: 5,
        totalOmset: 25_000_000,
        totalProfit: 10_000_000,
        avgOmset: 5_000_000,
      },
    ]
    const result = prepareRouteChartData(longNameItems)
    expect(result[0].label.length).toBeLessThanOrEqual(13) // 12 + "…"
    expect(result[0].label.endsWith("…")).toBe(true)
  })

  it("preserves input order", () => {
    const result = prepareRouteChartData(sampleItems)
    expect(result[0].destinationCity).toBe("TUBAN")
    expect(result[1].destinationCity).toBe("GROBOGAN")
  })
})
```

**Step 2: Verify test fails**
```bash
pnpm test domain/__tests__/route-trend.test.ts
```
Expected: FAIL — `Cannot find module '@/domain/route-trend'`

**Step 3: Write minimal implementation (GREEN)**

```typescript
// domain/route-trend.ts
import type { RouteBreakdownItem } from "@/features/dashboard/dashboard.queries"

const MAX_LABEL_LENGTH = 12

export interface ChartRouteItem extends RouteBreakdownItem {
  label: string
  omsetJuta: number
  profitJuta: number
}

function truncateLabel(city: string): string {
  if (city.length <= MAX_LABEL_LENGTH) return city
  return city.slice(0, MAX_LABEL_LENGTH) + "…"
}

export function prepareRouteChartData(
  items: RouteBreakdownItem[]
): ChartRouteItem[] {
  return items.map((item) => ({
    ...item,
    label: truncateLabel(item.destinationCity),
    omsetJuta: parseFloat((item.totalOmset / 1_000_000).toFixed(1)),
    profitJuta: parseFloat((item.totalProfit / 1_000_000).toFixed(1)),
  }))
}
```

**Step 4: Verify test passes**
```bash
pnpm test domain/__tests__/route-trend.test.ts
```
Expected: PASS — 6/6 tests hijau

---

## Task 3: Komponen Chart — `DashboardRouteChart`

**Files:**
- Create: `features/dashboard/dashboard-route-chart.tsx`

**Acceptance Criteria:**
1. Render **Horizontal BarChart** Recharts (`layout="vertical"`) dengan `dataKey="tripCount"` (ritase) sebagai bar utama.
2. Sumbu Y (kiri): label kota/rute (field `label`).
3. Sumbu X (bawah): angka ritase.
4. Custom Tooltip menampilkan: nama kota lengkap, jumlah rit, total omset (format `formatCurrency`), total profit, dan rata-rata omset/rit.
5. Empty-state jika `data.length === 0`: teks "Belum ada data rute untuk ditampilkan".
6. `ResponsiveContainer width="100%" height={data.length * 48 + 40}` (tinggi dinamis berdasarkan jumlah baris, min 200px).
7. Tidak ada legenda (sederhana — satu bar saja untuk ritase).

**Prop Interface:**
```typescript
interface DashboardRouteChartProps {
  data: ChartRouteItem[]
}
```

**Step 3: Write implementation (GREEN)**

```typescript
// features/dashboard/dashboard-route-chart.tsx
"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { ChartRouteItem } from "@/domain/route-trend"
import { formatCurrency } from "@/lib/utils"

interface DashboardRouteChartProps {
  data: ChartRouteItem[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ChartRouteItem }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5 shadow-md text-sm space-y-1 min-w-48">
      <p className="font-semibold text-foreground">{item.destinationCity}</p>
      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Jumlah Ritase</span>
          <span className="font-medium text-foreground tabular-nums">
            {item.tripCount} rit
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Total Omset</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(item.totalOmset)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Total Profit</span>
          <span className="font-medium text-blue-600 dark:text-blue-400 tabular-nums">
            {formatCurrency(item.totalProfit)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Avg Omset/Rit</span>
          <span className="font-medium text-foreground tabular-nums">
            {formatCurrency(item.avgOmset)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function DashboardRouteChart({ data }: DashboardRouteChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-50 items-center justify-center rounded-xl border border-dashed">
        <p className="text-sm text-muted-foreground">
          Belum ada data rute untuk ditampilkan
        </p>
      </div>
    )
  }

  const dynamicHeight = Math.max(200, data.length * 48 + 40)

  return (
    <ResponsiveContainer width="100%" height={dynamicHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
      >
        <CartesianGrid
          horizontal={false}
          strokeDasharray="3 3"
          className="stroke-border"
        />
        <XAxis
          type="number"
          dataKey="tripCount"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v} rit`}
          className="text-muted-foreground"
        />
        <YAxis
          type="category"
          dataKey="label"
          width={90}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
        />
        <Bar
          dataKey="tripCount"
          fill="hsl(var(--primary))"
          radius={[0, 4, 4, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

**Step 4: Verify**
```bash
pnpm exec tsc --noEmit
```
Expected: 0 TypeScript errors

---

## Task 4: Integrasi ke Halaman Dashboard

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`
- Modify: `features/dashboard/dashboard.queries.ts` (import sudah ada dari Task 1)

**Acceptance Criteria:**
1. Widget "Top Rute Teratas" ditampilkan **setelah** `<ChartAreaInteractive>` dan **sebelum** `<DataTable>`.
2. Data chart menggunakan `month` & `year` yang sama dengan KPI cards.
3. Komponen dibungkus dalam `Card` shadcn dengan judul "Top Rute Teratas Bulan Ini" dan badge jumlah rute unik.
4. Query `getTopRoutes` dijalankan **paralel** dalam `Promise.all` yang sudah ada (tidak waterfall).
5. Halaman tetap React Server Component.

**Step 3: Write implementation (GREEN)**

Modifikasi `app/(dashboard)/dashboard/page.tsx`:

```typescript
// Tambah import baru:
import { prepareRouteChartData } from "@/domain/route-trend"
import { DashboardRouteChart } from "@/features/dashboard/dashboard-route-chart"
import {
  getDailyTripChart,
  getDashboardKPIs,
  getRecentTrips,
  getTopRoutes,       // Tambah ini
  getTruckBreakdown,
} from "@/features/dashboard/dashboard.queries"
import { Badge } from "@/components/ui/badge"

// Update Promise.all:
const [kpis, truckBreakdown, chartData, recentTrips, topRoutes] =
  await Promise.all([
    getDashboardKPIs(month, year),
    getTruckBreakdown(month, year),
    getDailyTripChart(month, year),
    getRecentTrips(10),
    getTopRoutes(month, year, 10),   // Tambah ini
  ])

const routeChartData = prepareRouteChartData(topRoutes)

// Tambah section di antara ChartAreaInteractive dan DataTable:
{/* Top Routes Widget */}
<div className="px-4 lg:px-6">
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            Top Rute Teratas Bulan Ini
          </CardTitle>
          <CardDescription className="text-xs">
            Peringkat destinasi berdasarkan frekuensi ritase dan kontribusi omset
          </CardDescription>
        </div>
        <Badge variant="outline" className="text-xs font-normal">
          {routeChartData.length} Rute
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <DashboardRouteChart data={routeChartData} />
    </CardContent>
  </Card>
</div>
```

> **Catatan:** `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription` sudah diimport di `dashboard/page.tsx` yang ada.

**Step 4: Verify final**
```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm build && pnpm test
```
Expected: Semua PASS — 0 error TS, 0 lint warning, build sukses, seluruh unit test hijau.

---

## Verification Plan Final

| Langkah | Perintah | Ekspektasi |
|---|---|---|
| Unit Tests | `pnpm test` | Semua test hijau (≥ 9 test baru dari Task 1 & 2) |
| TypeScript | `pnpm exec tsc --noEmit` | 0 error |
| Linter | `pnpm lint` | 0 error, 0 warning |
| Build | `pnpm build` | Build sukses |
| Manual (browser) | Buka `/dashboard` di browser | Widget "Top Rute" tampil horizontal bar chart, tooltip informatif, filter bulan berfungsi |

---

*Setelah plan disetujui, jalankan `/scaffold-execute` untuk eksekusi Task per Task.*
