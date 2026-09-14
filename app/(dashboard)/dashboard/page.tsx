import Link from "next/link"
import {
  RiAddLine,
  RiArrowRightLine,
  RiCalendarLine,
  RiHandCoinLine,
  RiReceiptLine,
  RiTable2,
  RiTruckLine,
} from "@remixicon/react"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { prepareRouteChartData } from "@/domain/route-trend"
import { DashboardRouteChart } from "@/features/dashboard/dashboard-route-chart"
import {
  getDailyTripChart,
  getDashboardKPIs,
  getRecentTrips,
  getTopRoutes,
  getTruckBreakdown,
} from "@/features/dashboard/dashboard.queries"

export const dynamic = "force-dynamic"

interface DashboardPageProps {
  searchParams: Promise<{
    month?: string
    year?: string
  }>
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const resolvedParams = await searchParams
  const now = new Date()
  const month = resolvedParams.month
    ? parseInt(resolvedParams.month, 10)
    : now.getMonth() + 1
  const year = resolvedParams.year
    ? parseInt(resolvedParams.year, 10)
    : now.getFullYear()

  const [kpis, truckBreakdown, chartData, recentTrips, topRoutes] =
    await Promise.all([
      getDashboardKPIs(month, year),
      getTruckBreakdown(month, year),
      getDailyTripChart(month, year),
      getRecentTrips(10),
      getTopRoutes(month, year, 10),
    ])

  const routeChartData = prepareRouteChartData(topRoutes)

  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1))

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Page Title & Controls Bar */}
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Dashboard Operasional
            </h1>
            <span className="hidden items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline-flex">
              <RiCalendarLine className="size-3" />
              {monthLabel}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Ikhtisar ritase semen curah hi-blow, performa unit armada, dan
            efisiensi keuangan HW Trans
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/trips"
            className={buttonVariants({
              size: "sm",
              className: "h-9 gap-1.5 px-4 font-medium shadow-sm",
            })}
          >
            <RiAddLine className="size-4" />
            <span>Order Ritase Baru</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <SectionCards kpis={kpis} truckBreakdown={truckBreakdown} />

      {/* Interactive Performance Chart */}
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={chartData} />
      </div>

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
                  Peringkat destinasi berdasarkan frekuensi ritase dan
                  kontribusi omset
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

      {/* Recent Trips Data Table */}
      <div className="px-4 lg:px-6">
        <DataTable trips={recentTrips} />
      </div>


      {/* Modul Navigasi Operasional */}
      <div className="px-4 lg:px-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold tracking-tight">
            Akses Cepat Modul Operasional
          </h2>
          <p className="text-xs text-muted-foreground">
            Pilih modul untuk mengelola pencatatan armada dan keuangan secara
            mendalam
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-xs">
            <CardHeader className="pb-3">
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <RiTruckLine className="size-5" />
              </div>
              <CardTitle className="text-base">Pencatatan Ritase</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Input order surat jalan, auto-fill tarif master rute, dan
                perhitungan otomatis sangu supir.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link
                href="/trips"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "w-full justify-between",
                })}
              >
                <span>Buka Ritase</span>
                <RiArrowRightLine className="size-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between transition-all hover:border-amber-500/50 hover:shadow-xs">
            <CardHeader className="pb-3">
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <RiReceiptLine className="size-5" />
              </div>
              <CardTitle className="text-base">Pengeluaran Truk</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Pencatatan nota servis bengkel, ban, sparepart onderdil, solar,
                dan biaya tak terduga.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link
                href="/expenses"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "w-full justify-between",
                })}
              >
                <span>Buka Pengeluaran</span>
                <RiArrowRightLine className="size-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between transition-all hover:border-emerald-500/50 hover:shadow-xs">
            <CardHeader className="pb-3">
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <RiHandCoinLine className="size-5" />
              </div>
              <CardTitle className="text-base">Bagi Hasil Pemodal</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Rekapitulasi laba bersih tutup buku bulanan dan laporan dividen
                investor armada.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link
                href="/profit-sharing"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "w-full justify-between",
                })}
              >
                <span>Buka Bagi Hasil</span>
                <RiArrowRightLine className="size-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between transition-all hover:border-blue-500/50 hover:shadow-xs">
            <CardHeader className="pb-3">
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <RiTable2 className="size-5" />
              </div>
              <CardTitle className="text-base">Referensi Tarif</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Katalog master 289 tarif rute pabrik Semen Indonesia Tuban, SBI
                Rembang, dan Grobogan.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link
                href="/rates"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "w-full justify-between",
                })}
              >
                <span>Lihat Tarif</span>
                <RiArrowRightLine className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
