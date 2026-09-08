import { RiHandCoinLine, RiPieChartLine, RiTimeLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { PeriodCard } from "@/features/profit-sharing/period-card"
import { listProfitSharingPeriodsWithShares } from "@/features/profit-sharing/profit-sharing.queries"
import { formatCurrency } from "@/lib/utils"

interface PartnerProfitSharingViewProps {
  user?: {
    name?: string | null
    email?: string | null
  }
}

export async function PartnerProfitSharingView({
  user,
}: PartnerProfitSharingViewProps) {
  const allPeriods = await listProfitSharingPeriodsWithShares()
  const finalizedPeriods = allPeriods.filter((p) => p.status === "finalized")

  const totalDistributed = finalizedPeriods.reduce(
    (sum, p) => sum + parseFloat(p.distributableProfit || "0"),
    0
  )

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Laporan Bagi Hasil Investor
            </h1>
            <Badge variant="outline" className="text-xs font-normal">
              {finalizedPeriods.length} Periode Diterbitkan
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Selamat datang,{" "}
            <strong className="text-foreground">
              {user?.name ?? "Investor"}
            </strong>
            . Berikut rekapitulasi distribusi dividen bagi hasil armada HW
            Trans.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 lg:px-6">
        {finalizedPeriods.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground/60 shadow-xs">
              <RiHandCoinLine className="size-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Belum Ada Laporan Bagi Hasil
              </h3>
              <p className="max-w-sm text-xs text-muted-foreground">
                Laporan bagi hasil resmi akan muncul di sini setelah manajemen
                melakukan tutup buku dan finalisasi periode.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">
                    Periode Tutup Buku Resmi
                  </span>
                  <RiTimeLine className="size-4" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {finalizedPeriods.length}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Siklus Final
                  </span>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">
                    Total Dividen Dibagikan
                  </span>
                  <RiHandCoinLine className="size-4 text-emerald-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalDistributed)}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid of Finalized Periods */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiPieChartLine className="size-4 text-primary" />
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    Daftar Periode Tutup Buku
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  Klik &ldquo;Rincian & Cetak&rdquo; untuk lembar pembagian
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {finalizedPeriods.map((period) => (
                  <PeriodCard key={period.id} period={period} readOnly />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
