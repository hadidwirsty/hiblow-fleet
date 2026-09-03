import Link from "next/link"
import {
  RiArrowRightLine,
  RiHandCoinLine,
  RiReceiptLine,
  RiTable2,
  RiTruckLine,
} from "@remixicon/react"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Dashboard Operasional
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sistem Informasi Manajemen Armada & Keuangan Hi-Blow HW Trans
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-colors hover:border-primary/50">
          <CardHeader className="pb-3">
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RiTruckLine className="size-5" />
            </div>
            <CardTitle className="text-base">Pencatatan Ritase</CardTitle>
            <CardDescription className="text-xs">
              Input order jalan, auto-fill tarif & hitung sangu supir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/trips"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "w-full",
              })}
            >
              Buka Ritase <RiArrowRightLine className="ml-1 size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="transition-colors hover:border-primary/50">
          <CardHeader className="pb-3">
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <RiReceiptLine className="size-5" />
            </div>
            <CardTitle className="text-base">Pengeluaran Truk</CardTitle>
            <CardDescription className="text-xs">
              Catat nota servis bengkel, onderdil, BBM & administrasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/expenses"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "w-full",
              })}
            >
              Buka Pengeluaran <RiArrowRightLine className="ml-1 size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="transition-colors hover:border-primary/50">
          <CardHeader className="pb-3">
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <RiHandCoinLine className="size-5" />
            </div>
            <CardTitle className="text-base">Bagi Hasil Pemodal</CardTitle>
            <CardDescription className="text-xs">
              Rekapitulasi laba tutup buku & pembagian dividen investor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/profit-sharing"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "w-full",
              })}
            >
              Buka Bagi Hasil <RiArrowRightLine className="ml-1 size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="transition-colors hover:border-primary/50">
          <CardHeader className="pb-3">
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <RiTable2 className="size-5" />
            </div>
            <CardTitle className="text-base">Referensi Tarif</CardTitle>
            <CardDescription className="text-xs">
              289 master tarif rute pabrik Semen Indonesia, SBI & Grobogan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/rates"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "w-full",
              })}
            >
              Lihat Tarif <RiArrowRightLine className="ml-1 size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
