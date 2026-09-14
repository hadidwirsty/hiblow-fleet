import { RiHandCoinLine, RiPieChartLine, RiTimeLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { PeriodCard } from "@/features/profit-sharing/period-card"
import type { ProfitSharingPeriodDetail } from "@/features/profit-sharing/profit-sharing.queries"
import { formatCurrency } from "@/lib/utils"

interface PartnerProfitSharingViewProps {
  user?: {
    name?: string | null
    email?: string | null
  }
  userId?: string
  myTotalDividend?: number
  mySharesMap?: Map<string, number>
  periods: ProfitSharingPeriodDetail[]
}

export function PartnerProfitSharingView({
  user,
  myTotalDividend,
  mySharesMap,
  periods,
}: PartnerProfitSharingViewProps) {
  const finalizedPeriods = periods.filter((p) => p.status === "finalized")

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
            {/* Kartu Sorotan Hak Dividen Personal Investor */}
            {myTotalDividend !== undefined && myTotalDividend > 0 && (
              <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 shadow-xs sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-emerald-700 sm:text-sm dark:text-emerald-400">
                      Total Hak Dividen Anda (All-Time)
                    </p>
                    <p className="text-xl font-bold text-emerald-600 tabular-nums sm:text-3xl dark:text-emerald-400">
                      {formatCurrency(myTotalDividend)}
                    </p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 sm:size-12 dark:text-emerald-400">
                    <RiHandCoinLine className="size-5 sm:size-6" />
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground sm:text-xs">
                  Akumulasi dividen resmi dari seluruh periode bagi hasil yang
                  sudah finalized
                </p>
              </div>
            )}

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              <div className="rounded-xl border bg-card p-3 shadow-xs sm:p-4">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] font-medium sm:text-xs">
                    Periode Resmi
                  </span>
                  <RiTimeLine className="size-3.5 sm:size-4" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5 sm:mt-2 sm:gap-2">
                  <span className="text-xl font-bold text-foreground sm:text-2xl">
                    {finalizedPeriods.length}
                  </span>
                  <span className="text-[10px] text-muted-foreground sm:text-xs">
                    Siklus Final
                  </span>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-3 shadow-xs sm:p-4">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] font-medium sm:text-xs">
                    Total Dividen
                  </span>
                  <RiHandCoinLine className="size-3.5 text-emerald-500 sm:size-4" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5 sm:mt-2 sm:gap-2">
                  <span className="text-lg font-bold text-emerald-600 sm:text-2xl dark:text-emerald-400">
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
                  <PeriodCard
                    key={period.id}
                    period={period}
                    readOnly
                    myPayoutAmount={mySharesMap?.get(period.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
