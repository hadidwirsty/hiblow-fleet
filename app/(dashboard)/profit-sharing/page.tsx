import {
  RiCoinsLine,
  RiHandCoinLine,
  RiPieChartLine,
  RiTimeLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { extractMyShares } from "@/domain/investor-personalization"
import { PartnerProfitSharingView } from "@/features/profit-sharing/partner-profit-sharing-view"
import { PeriodCard } from "@/features/profit-sharing/period-card"
import { PeriodWizardDialog } from "@/features/profit-sharing/period-wizard-dialog"
import { ProfitSharingEmptyState } from "@/features/profit-sharing/profit-sharing-empty-state"
import {
  getMyTotalDividend,
  listProfitSharingPeriodsWithShares,
} from "@/features/profit-sharing/profit-sharing.queries"
import { isAdmin } from "@/lib/rbac"
import { getCurrentSession } from "@/lib/session"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function ProfitSharingPage() {
  const session = await getCurrentSession()
  const userIsAdmin = isAdmin(session?.user)

  // Otorisasi: Tampilan khusus untuk Partner / Investor
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
        periods={allPeriods}
      />
    )
  }

  const periods = await listProfitSharingPeriodsWithShares()

  const totalDistributedAllTime = periods.reduce(
    (sum, p) => sum + parseFloat(p.distributableProfit || "0"),
    0
  )
  const totalManagerTakeHomeAllTime = periods.reduce(
    (sum, p) => sum + parseFloat(p.managerTakeHome || "0"),
    0
  )

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Bagi Hasil Pemodal
            </h1>
            <span className="hidden items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline-flex">
              <RiPieChartLine className="size-3" />
              Tutup Buku
            </span>
            <Badge variant="outline" className="text-xs font-normal">
              {periods.length} Periode
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Kalkulator dan rekapitulasi tutup buku bagi hasil laba bersih armada
            HW Trans untuk investor
          </p>
        </div>

        {/* CTA Wizard Trigger Button */}
        <div className="flex items-center gap-2.5">
          <PeriodWizardDialog />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 lg:px-6">
        {periods.length === 0 ? (
          <ProfitSharingEmptyState>
            <PeriodWizardDialog />
          </ProfitSharingEmptyState>
        ) : (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">
                    Total Periode Ditutup
                  </span>
                  <RiTimeLine className="size-4" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {periods.length}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Bulan/Siklus
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
                    {formatCurrency(totalDistributedAllTime)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">
                    Total Hak Pengelola Kumulatif
                  </span>
                  <RiCoinsLine className="size-4 text-primary" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(totalManagerTakeHomeAllTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid of Periods */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Riwayat Periode Tutup Buku
                </h2>
                <span className="text-xs text-muted-foreground">
                  Diurutkan berdasarkan tanggal terbaru
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {periods.map((period) => (
                  <PeriodCard key={period.id} period={period} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
